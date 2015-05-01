urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'

###
# Retrieves video data from Vimeo anonymously.
#
# Returns a Media object
###
lookupAnonymous = (id) ->
    return getJSON("https://vimeo.com/api/v2/video/#{id}.json").then((result) ->
        video = result[0]
        return new Media(
            id: id
            title: video.title
            duration: video.duration
            type: 'vimeo'
            meta:
                thumbnail: video.thumbnail_medium
        )
    )

exports.lookup = lookup = lookupAnonymous

###
# Attempts to parse a Vimeo URL of the form vimeo.com/(video id)
#
# Returns {
#           id: video id
#           kind: 'single'
#           type: 'vimeo'
#         }
# or null if the URL is invalid.
###
exports.parseUrl = (url) ->
    m = url.match(/^vi:(\d+)/)
    if m
        return {
            type: 'vimeo'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url)

    if data.hostname isnt 'vimeo.com'
        return null

    if not data.pathname.match(/^\/\d+$/)
        return null

    return {
        type: 'vimeo'
        kind: 'single'
        id: data.pathname.replace(/^\//, '')
    }
