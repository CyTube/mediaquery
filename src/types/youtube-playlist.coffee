querystring = require 'querystring'
urlparse = require 'url'

Playlist = require '../playlist'
YouTubeVideo = require './youtube-video'
{ getJSON } = require '../request'

module.exports = class YouTubePlaylist extends Playlist
    type: 'youtube-playlist'

    shortCode: 'yp'

    fetch: (opts = {}) ->
        if not @apiKey
            return Promise.reject(new Error('YouTube v3 API requires an API key'))

        params =
            key: @apiKey
            part: 'contentDetails'
            maxResults: 50
            playlistId: @id

        if opts.nextPage
            params.pageToken = opts.nextPage

        params = querystring.stringify(params)

        url = "https://www.googleapis.com/youtube/v3/playlistItems?#{params}"

        return getJSON(url).then((result) =>
            return YouTubeVideo.lookupMany(result.items.map(
                (item) -> item.contentDetails.videoId), opts
            ).then((videos) =>
                if result.nextPageToken
                    opts.nextPage = result.nextPageToken
                    return @fetch(opts).then((videos) =>
                        @items = @items.concat(videos)
                        @totalSeconds = @items.reduce((current, video) ->
                            current + video.seconds
                        , 0)
                        return this
                    )
                else
                    @items = videos
                    @totalDuration = videos.reduce((current, video) ->
                        current + video.seconds
                    , 0)
                    return this
            )
        )

YouTubePlaylist.setAPIKey = (apiKey) ->
    YouTubePlaylist.prototype.apiKey = apiKey

###
# > YouTubePlaylist.parseURL(require('url').parse('https://www.youtube.com/playlist?list=asdf', true))
# {id: 'asdf', type: 'youtube-playlist'}
# > YouTubePlaylist.parseURL(require('url').parse('https://www.youtube.com/watch?v=blah&list=asdf', true))
# null
# > YouTubePlaylist.parseURL(require('url').parse('https://youtube.com/playlist?foo=bar&list=asdf', true))
# {id: 'asdf', type: 'youtube-playlist'}
###
YouTubePlaylist.parseURL = (url) ->
    data = urlparse.parse(url, true)
    if data.hostname not in ['www.youtube.com', 'youtube.com']
        return null

    if data.pathname is '/playlist'
        return {
            type: 'youtube-playlist'
            id: data.query.list
        }
    else
        return null
