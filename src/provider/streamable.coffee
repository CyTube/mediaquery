urlparse = require 'url'
Promise = require 'bluebird'

request = require '../request'
Media = require '../media'

exports.lookup = (id) ->
    return request.getJSON("https://api.streamable.com/videos/#{id}").then((result) ->
        switch result.status
            when 0 then throw new Error('Video is not done uploading yet')
            when 1 then throw new Error('Video is not done processing yet')
            when 3 then throw new Error('Video is unavailable')

        duration = 0
        streams =
            1080: []
            720: []
            480: []
            360: []
        for key, file of result.files
            contentType = switch
                when /mp4/.test(key) then 'video/mp4'
                when /webm/.test(key) then 'video/webm'
                else null

            if contentType is null
                continue

            if file.height in [360, 480, 720, 1080] and file.status == 2
                streams[file.height].push({
                    link: "https:#{file.url}"
                    contentType: contentType
                })
                duration = Math.max(Math.ceil(file.duration), duration)

        if isNaN(duration)
            throw new Error('Streamable API did not return any video duration')

        return new Media(
            id: id
            title: result.title
            duration: duration
            type: 'streamable'
            meta:
                direct: streams
                thumbnail: "https:#{result.thumbnail_url}"
        )
    )

exports.parseUrl = (url) ->
    m = url.match(/^sb:([\w-]+)$/)
    if m
        return {
            type: 'streamable'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url, true)

    if data.hostname not in ['streamable.com']
        return null

    m = data.pathname.match(/^\/(?:e\/)?([\w-]+)/)
    if m
        return {
            type: 'streamable'
            kind: 'single'
            id: m[1]
        }

    return null
