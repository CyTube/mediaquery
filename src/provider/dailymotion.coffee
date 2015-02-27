querystring = require 'querystring'

{ getJSON } = require '../request'
Media = require '../media'

DM_FIELDS = [
    'title'
    'duration'
    'thumbnail_120_url'
    'allow_embed'
    'status'
].join(',')

exports.lookup = lookup = (id) ->
    id = id.split('_')[0]

    params = "?fields=#{DM_FIELDS}"
    url = "https://api.dailymotion.com/video/#{id}#{params}"

    return getJSON(url).then((result) ->
        if not result.allow_embed
            return Promise.reject(new Error('Video is not embeddable'))

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
