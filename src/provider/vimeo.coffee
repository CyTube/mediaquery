{ getJSON } = require '../request'
Media = require '../media'

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
