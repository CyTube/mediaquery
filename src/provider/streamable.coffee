urlparse = require 'url'
Promise = require 'bluebird'

request = require '../request'
Media = require '../media'

QUALITIES = [240, 360, 480, 540, 720, 1080, 1440, 2160]

getQuality = (width, height) ->
    if width > height
        x = height
    else
        # Portrait video (why.jpg)
        x = width

    # Streamable doesn't rescale videos, so we kinda have to just guess at the
    # right quality label for this size
    for q in QUALITIES
        if x <= q
            return q

    return QUALITIES[QUALITIES.length - 1]


exports.lookup = (id) ->
    return request.getJSON("https://api.streamable.com/videos/#{id}").then((result) ->
        switch result.status
            when 0 then throw new Error('Video is not done uploading yet')
            when 1 then throw new Error('Video is not done processing yet')
            when 3 then throw new Error('Video is unavailable')

        duration = 0
        streams = {}
        for key, file of result.files
            contentType = switch
                when /mp4/.test(key) then 'video/mp4'
                when /webm/.test(key) then 'video/webm'
                else null

            if contentType is null
                continue

            if file.status == 2
                quality = getQuality(file.width, file.height)
                if quality not of streams
                    streams[quality] = []
                streams[quality].push({
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
