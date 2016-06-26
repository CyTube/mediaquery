urlparse = require 'url'
Promise = require 'bluebird'

request = require '../request'
Media = require '../media'

exports.lookup = (id) ->
    return request.getJSON("https://api.vid.me/videoByUrl?url=\
                            https://vid.me/#{id}",
                            skipStatusCheck: [400]).then((result) ->
        if not result.status
            throw new Error("Vidme returned an error: #{result.error}")

        video = result.video
        if video.state isnt 'success'
            throw new Error('Video has not finished uploading successfully')

        streams = {}
        for stream in video.formats
            if /^(360|480|720|1080)p$/.test(stream.type)
                streams[stream.type.replace('p', '')] = [{
                    contentType: 'video/mp4'
                    link: stream.uri
                }]

        return new Media(
            id: id
            title: video.title
            duration: video.duration
            type: 'vidme'
            meta:
                thumbnail: video.thumbnail_url
                direct: streams
        )
    )

exports.parseUrl = (url) ->
    m = url.match(/^vm:([\w-]+)$/)
    if m
        return {
            type: 'vidme'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url, true)

    if data.hostname not in ['vid.me']
        return null

    m = data.pathname.match(/^\/(?:e\/)?([\w-]+)/)
    if m
        return {
            type: 'vidme'
            kind: 'single'
            id: m[1]
        }

    return null
