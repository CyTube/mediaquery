querystring = require 'querystring'
urlparse = require 'url'

Playlist = require '../playlist'
DailymotionVideo = require './dailymotion-video'
{ getJSON } = require '../request'

DM_FIELDS = [
    'id'
    'title'
    'duration'
    'thumbnail_120_url'
    'allow_embed'
    'status'
].join(',')

module.exports = class DailymotionPlaylist extends Playlist
    type: 'dailymotion-playlist'

    shortCode: 'dp'

    fetch: (opts = {}) ->
        return @_fetch(opts).then((videos) =>
            @items = videos
            @totalSeconds = @items.reduce((current, video) ->
                return current + video.seconds
            , 0)
            return this
        )

    _fetch: (opts = {}) ->
        params =
            fields: DM_FIELDS
            limit: 100

        if opts.nextPage
            params.page = opts.nextPage

        params = querystring.stringify(params)

        url = "https://api.dailymotion.com/playlist/#{@id}/videos?#{params}"
        return getJSON(url).then((playlist) =>
            videos = playlist.list
            if opts.failNonEmbeddable
                videos = videos.filter((video) -> video.allow_embed)

            videos = videos.map((video) ->
                media = new DailymotionVideo().fromExistingData(
                    id: video.id
                    title: video.title
                    seconds: video.seconds
                    meta:
                        thumbnail: video.thumbnail_120_url
                )
                return media
            )

            if playlist.has_more
                opts.nextPage = playlist.page + 1
                return @_fetch(opts).then((moreVideos) =>
                    videos = videos.concat(moreVideos)
                    return videos
                )
            else
                return videos

        )

###
# > DailymotionPlaylist.parseURL(require('url').parse('http://www.dailymotion.com/playlist/x1ix36_radiopratica_classical-music/1#video=xn7ce', true))
# {id: 'x1ix36', type: 'dailymotion-playlist'}
###
DailymotionPlaylist.parseURL = (data) ->
    if data.hostname not in ['www.dailymotion.com', 'dailymotion.com']
        return null

    m = data.pathname.match(/^\/playlist\/([a-zA-Z0-9]+)/)
    if not m
        return null

    return {
        type: DailymotionPlaylist.prototype.type
        id: m[1]
    }

