Promise = require 'bluebird'
querystring = require 'querystring'

{ getJSON } = require '../request'
Media = require '../media'

API_KEY = null

# https://en.wikipedia.org/wiki/ISO_8601#Durations
DURATION_SCALE = [
    [/(\d+)D/, 24*3600],
    [/(\d+)H/, 3600],
    [/(\d+)M/, 60],
    [/(\d+)S/, 1]
]

###
# Parse an ISO 8601 time duration (the format used by YouTube).
# In the interest of sanity, only days, hours, minutes, and seconds are
# considered.
###
parseDuration = (duration) ->
    time = 0
    for [regex, scale] in DURATION_SCALE
        if m = duration.match(regex)
            time += parseInt(m[1]) * scale

    return time

###
# Retrieve metadata for a single YouTube video.
#
# Returns a Media object
###
exports.lookup = lookup = (id) ->
    if not API_KEY
        return Promise.reject(new Error('API key not set for YouTube v3 API'))

    params = querystring.stringify(
        key: API_KEY
        part: 'contentDetails,status,snippet'
        id: id
    )

    url = "https://www.googleapis.com/youtube/v3/videos?#{params}"

    return getJSON(url).then((result) ->

        # Sadly, as of the v3 API, YouTube doesn't tell you *why* the request failed.
        if result.items.length == 0
            throw new Error('Video does not exist or is private')

        video = result.items[0]

        if not video.status.embeddable
            throw new Error('Video is not embeddable')

        data =
            id: id
            type: 'youtube'
            title: video.snippet.title
            duration: parseDuration(video.contentDetails.duration)
            meta:
                thumbnail: video.snippet.thumbnails.default.url

        if video.contentDetails.regionRestriction
            restriction = video.contentDetails.regionRestriction
            data.meta.blocked = restriction.blocked if restriction.blocked
            data.meta.allowed = restriction.allowed if restriction.allowed

        return new Media(data)
    )

###
# Retrieve metadata for multiple YouTube videos.  As this is intended for use
# by the search and playlist retrieval, it does not check for failed video IDs.
# If a video is private, removed, or non-embeddable, its information simply
# doesn't appear in the results.
#
# Returns a list of Media objects
###
exports.lookupMany = lookupMany = (ids) ->
    if not API_KEY
        return Promise.reject(new Error('API key not set for YouTube v3 API'))

    params = querystring.stringify(
        key: API_KEY
        part: 'contentDetails,status,snippet'
        id: ids.join(',')
    )

    url = "https://www.googleapis.com/youtube/v3/videos?#{params}"

    return getJSON(url).then((result) ->
        return result.items.filter((video) -> video.status.embeddable).map((video) ->
            data =
                id: video.id
                type: 'youtube'
                title: video.snippet.title
                duration: parseDuration(video.contentDetails.duration)
                meta:
                    thumbnail: video.snippet.thumbnails.default.url

            if video.contentDetails.regionRestriction
                restriction = video.contentDetails.regionRestriction
                data.meta.blocked = restriction.blocked if restriction.blocked
                data.meta.allowed = restriction.allowed if restriction.allowed

            return new Media(data)
        )
    )

###
# Search for YouTube videos.  Optionally provide the ID of the page of results
# to retrieve.
#
# Returns { nextPage: (string: next page token), results: (list of Media) }
###
exports.search = search = (query, nextPage = false) ->
    if not API_KEY
        return Promise.reject(new Error('API key not set for YouTube v3 API'))

    query = query.replace(/%20/g, '+')

    params =
        key: API_KEY
        part: 'id'
        maxResults: 25
        q: query
        type: 'video'

    if nextPage
        params.pageToken = nextPage

    params = querystring.stringify(params)

    url = "https://www.googleapis.com/youtube/v3/search?#{params}"

    return getJSON(url).then((result) ->
        # https://code.google.com/p/gdata-issues/issues/detail?id=4294
        return lookupMany(result.items.map((item) -> item.id.videoId)).then((videos) ->
            return {
                nextPage: result.nextPageToken or false
                results: videos
            }
        )
    )

###
# Retrieve metadata for all items on a YouTube playlist.  For playlists longer
# than 50 videos, it recurses to retrieve every page of results.
#
# Returns a list of Media objects
###
exports.lookupPlaylist = lookupPlaylist = (id, nextPage = false) ->
    if not API_KEY
        return Promise.reject(new Error('API key not set for YouTube v3 API'))

    params =
        key: API_KEY
        part: 'contentDetails'
        maxResults: 50
        playlistId: id

    if nextPage
        params.pageToken = nextPage

    params = querystring.stringify(params)

    url = "https://www.googleapis.com/youtube/v3/playlistItems?#{params}"

    return getJSON(url).then((result) ->
        return lookupMany(result.items.map((item) -> item.contentDetails.videoId))
                .then((videos) ->
            if result.nextPageToken
                # Retrieve the rest of the results, then concatenate them with the current
                # page
                return lookupPlaylist(id, result.nextPageToken).then((other) ->
                    return videos.concat(other)
                )
            else
                # No more pages of results
                return videos
        )
    )

exports.setApiKey = (key) ->
    API_KEY = key
