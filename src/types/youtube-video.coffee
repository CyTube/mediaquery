querystring = require 'querystring'
urlparse = require 'url'
Promise = require 'bluebird'

{ getJSON } = require '../request'
Media = require '../media'

# https://en.wikipedia.org/wiki/ISO_8601#Durations
DURATION_SCALE = [
    [/(\d+)D/, 24*3600],
    [/(\d+)H/, 3600],
    [/(\d+)M/, 60],
    [/(\d+)S/, 1]
]

module.exports = class YouTubeVideo extends Media
    type: 'youtube'

    shortCode: 'yt'

    apiKey: null

    fetch: (opts = {}) ->
        if not @apiKey
            return Promise.reject(new Error('YouTube v3 API requires an API key'))

        params = querystring.stringify(
            key: @apiKey
            part: 'contentDetails,status,snippet'
            id: @id
        )

        url = "https://www.googleapis.com/youtube/v3/videos?#{params}"

        return getJSON(url).then((result) =>
            # Sadly, as of the v3 API, YouTube doesn't tell you *why* the request failed.
            if result.items.length == 0
                throw new Error('Video does not exist or is private')

            video = result.items[0]

            switch video.status.uploadStatus
                when 'deleted' then throw new Error('This video has been deleted')
                when 'failed', 'rejected' then throw new Error('This video is unavailable')

            if not video.status.embeddable
                if opts.failNonEmbeddable
                    throw new Error('The uploader has made this video non-embeddable')
                else
                    @meta.notEmbeddable = true

            @title = video.snippet.title
            @duration = exports.parseDuration(video.contentDetails.duration)
            @meta.thumbnail = video.snippet.thumbnails.default.url
            exports.setRegionRestrictions(video, @meta)

            return this
        )

YouTubeVideo.setAPIKey = (key) ->
    YouTubeVideo.prototype.apiKey = key

###
# > YouTubeVideo.parseURL(require('url').parse('https://youtu.be/000al7ru3ms', true))
# {type: 'youtube', id: '000al7ru3ms'}
# > YouTubeVideo.parseURL(require('url').parse('https://www.youtube.com/watch?v=000al7ru3ms', true))
# {type: 'youtube', id: '000al7ru3ms'}
# > YouTubeVideo.parseURL(require('url').parse('https://youtube.com/watch?feature=player_embedded&v=000al7ru3ms', true))
# {type: 'youtube', id: '000al7ru3ms'}
# > YouTubeVideo.parseURL(require('url').parse('https://www.youtube.com/user/JonTronShow', true))
# null
# > YouTubeVideo.parseURL(require('url').parse('asdf', true))
# null
###
YouTubeVideo.parseURL = (url) ->
    data = urlparse.parse(url, true)

    if data.hostname is 'youtu.be'
        return {
            type: YouTubeVideo.prototype.type
            id: data.pathname.replace(/^\//, '')
        }
    else if data.hostname not in ['www.youtube.com', 'youtube.com']
        return null

    if data.pathname is '/watch'
        return {
            type: YouTubeVideo.prototype.type
            id: data.query.v
        }
    else
        return null

YouTubeVideo.search = (query, opts = { nextPage: false }) ->
    if not YouTubeVideo.prototype.apiKey
        return Promise.reject(new Error('YouTube v3 API requires an API key'))

    params =
        key: YouTubeVideo.prototype.apiKey
        part: 'id'
        maxResults: 25
        q: query
        type: 'video'

    if opts.nextPage
        params.pageToken = nextPage

    params = querystring.stringify(params)
    params = params.replace(/%20/g, '+')
    url = "https://www.googleapis.com/youtube/v3/search?#{params}"

    return getJSON(url).then((result) ->
        # Note that it is necessary to perform a second lookup to retrieve
        # useful video metadata.
        # See https://code.google.com/p/gdata-issues/issues/detail?id=4294
        return YouTubeVideo.lookupMany(
            result.items.map((item) -> item.id.videoId),
            opts.filterEmbeddable
        ).then((videos) ->
            return {
                nextPage: result.nextPageToken or false
                results: videos
            }
        )
    )

###
# Parse an ISO 8601 time duration (the format used by YouTube).
# In the interest of sanity, only days, hours, minutes, and seconds are
# considered.
###
exports.parseDuration = (duration) ->
    time = 0
    for [regex, scale] in DURATION_SCALE
        if m = duration.match(regex)
            time += parseInt(m[1], 10) * scale

    return time

exports.setRegionRestrictions = (video, meta) ->
    if video.contentDetails.regionRestriction
        restriction = video.contentDetails.regionRestriction
        if restriction.blocked
            meta.blockedCountries = restriction.blocked
        if restriction.allowed
            meta.allowedCountries = restriction.allowed

###
# Retrieve metadata for multiple YouTube videos.  As this is intended for use
# by the search and playlist retrieval, it does not check for failed video IDs.
# If a video is private or removed, its information simply doesn't appear in
# the results.
###
YouTubeVideo.lookupMany = lookupMany = (ids, filterEmbeddable = false) ->
    if not YouTubeVideo.prototype.apiKey
        return Promise.reject(new Error('API key not set for YouTube v3 API'))

    params = querystring.stringify(
        key: YouTubeVideo.prototype.apiKey
        part: 'contentDetails,status,snippet'
        id: ids.join(',')
    )

    url = "https://www.googleapis.com/youtube/v3/videos?#{params}"

    return getJSON(url).then((result) ->
        if filterEmbeddable
            result.items = result.items.filter((video) -> video.status.embeddable)

        return result.items.map((video) ->
            media = new YouTubeVideo().fromExistingData(
                id: video.id
                title: video.snippet.title
                duration: exports.parseDuration(video.contentDetails.duration)
                meta:
                    thumbnail: video.snippet.thumbnails.default.url
            )

            exports.setRegionRestrictions(video, media.meta)
            if not video.status.embeddable
                media.meta.notEmbeddable = true
            return media
        )
    )
