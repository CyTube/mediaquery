urlparse = require 'url'
Promise = require 'bluebird'

request = require '../request'
Media = require '../media'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0'

###
# Retrieves video data from Vimeo anonymously.
#
# Returns a Media object
###
lookupAnonymous = (id) ->
    return request.getJSON("https://vimeo.com/api/v2/video/#{id}.json").then((result) ->
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

exports.extract = extract = (id) ->
    url = "https://player.vimeo.com/video/#{id}"
    return request.request(url,
        'User-Agent': USER_AGENT
    ).then((res) ->
        if res.statusCode != 200
            return {}

        start = res.data.indexOf('{"cdn_url"')
        if start < 0
            return {}

        end = res.data.indexOf('};', start)
        data = res.data.substring(start, end+1)

        try
            data = JSON.parse(data)
            videos =
                720: []
                360: []
                240: []

            files = data.request.files.h264
            if 'mobile' of files
                videos[240].push(
                    link: files.mobile.url
                    contentType: 'mp4'
                )
            if 'sd' of files
                videos[360].push(
                    link: files.sd.url
                    contentType: 'mp4'
                )
            if 'hd' of files
                videos[720].push(
                    link: files.hd.url
                    contentType: 'mp4'
                )

            return videos
        catch e
            if res.data.indexOf('This video does not exist.') >= 0
                return {}
            else if res.data.indexOf('Because of its privacy settings, this video cannot
                                      be played here') >= 0
                return {}
            console.error("vimeo::lookupAndExtract() failed: #{e.stack}")
            return {}
    )

exports.lookupAndExtract = lookupAndExtract = (id) ->
    video = null
    return Promise.all([
        lookup(id),
        extract(id)
    ]).then(([video, files]) ->
        video.meta.direct = files
        return video
    )

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
