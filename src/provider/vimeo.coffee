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

extractFromH264Object = (fileMap) ->
    videos =
        720: []
        360: []
        240: []

    if 'mobile' of fileMap
        videos[240].push(
            link: fileMap.mobile.url
            contentType: 'video/mp4'
        )

    if 'sd' of fileMap
        videos[360].push(
            link: fileMap.sd.url
            contentType: 'video/mp4'
        )

    if 'hd' of fileMap
        videos[720].push(
            link: fileMap.hd.url
            contentType: 'video/mp4'
        )

    return videos

extractFromProgressiveList = (fileList) ->
    videos =
        720: []
        360: []
        480: []
        240: []

    for file in fileList
        source =
            link: file.url
            contentType: file.mime

        try
            quality = switch file.quality
                when '720p' then 720
                when '480p' then 480
                when '360p' then 360
                when '270p' then 240
                else throw new Error("Unrecognized quality #{file.quality}")
        catch e
            console.error("vimeo::extract(): #{e}")
            continue

        videos[quality].push(source)

    return videos

exports.extract = extract = (id) ->
    url = "https://player.vimeo.com/video/#{id}"
    return request.request(url,
        headers:
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
            files = data.request.files.progressive
            if data.request.files.progressive
                return extractFromProgressiveList(data.request.files.progressive)
            else if data.request.files.h264
                return extractFromH264Object(data.request.files.h264)
            else
                console.error("vimeo::extract() was missing files for vi:#{id}")
                return {}
        catch e
            if res.data.indexOf('This video does not exist.') >= 0
                return {}
            else if res.data.indexOf('Because of its privacy settings, this video cannot
                                      be played here') >= 0
                return {}
            console.error("vimeo::extract() failed for vi:#{id} : #{e.stack}")
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
