querystring = require 'querystring'
urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'

DM_FIELDS = [
    'title'
    'duration'
    'thumbnail_120_url'
    'allow_embed'
    'status'
].join(',')

###
# Retrieves video data for a Dailymotion video
#
# Returns a Media object
###
exports.lookup = lookup = (id) ->
    id = id.split('_')[0]

    params = "?fields=#{DM_FIELDS}"
    url = "https://api.dailymotion.com/video/#{id}#{params}"

    return getJSON(url).then((result) ->
        if not result.allow_embed
            return Promise.reject(new Error('The uploader has made this video
                                             non-embeddable'))

        if result.status isnt 'published'
            return Promise.reject(new Error('Video status is not published'))

        data =
            id: id
            type: 'dailymotion'
            title: result.title
            duration: result.duration
            meta:
                thumbnail: result.thumbnail_120_url

        return new Media(data)
    )

###
# Attempts to parse a Dailymotion URL of the form dailymotion.com/video/(video id)
#
# Returns {
#           id: video id
#           kind: 'single'
#           type: 'dailymotion'
#         }
# or null if the URL is invalid
###
exports.parseUrl = (url) ->
    m = url.match(/^dm:([a-zA-Z0-9]+)/)
    if m
        return {
            type: 'dailymotion'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url)

    if data.hostname not in ['www.dailymotion.com', 'dailymotion.com']
        return null

    m = data.pathname.match(/^\/video\/([a-zA-Z0-9]+)/)
    if not m
        return null

    return {
        id: m[1]
        kind: 'single'
        type: 'dailymotion'
    }
