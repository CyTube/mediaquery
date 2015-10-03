urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'
{ ITAG_QMAP, ITAG_CMAP } = require '../util/itag'

reject = (msg) -> Promise.reject(new Error(msg))

exports.lookup = lookup = (id) ->
    [uid, aid, pid] = id.split('_')
    if not uid or not aid or not pid
        return reject('Invalid Google+ video ID')

    url = "https://picasaweb.google.com/data/feed/api/user/#{uid}/albumid/#{aid}/\
          photoid/#{pid}?kind=tag&alt=json"

    return getJSON(url).then((result) ->
        $ = result.feed
        switch $.gphoto$videostatus.$t
            when 'pending' then return reject('The video is still being processed')
            when 'failed' then return reject('A processing error has occurred')
            when 'ready' then return reject('The video has been processed but is not yet
                                            accessible')

        if not $.gphoto$originalvideo or not $.media$group or not
                $.media$group.media$title or not $.media$group.media$content
            return reject('Unable to retrieve video information.  Check that the video
                          exists and is shared publicly')

        duration = $.gphoto$originalvideo.duration
        title = $.media$group.media$title.$t
        thumbnails = $.media$group.media$thumbnail

        videos =
            1080: []
            720: []
            480: []
            360: []

        $.media$group.media$content.forEach((entry) ->
            if entry.medium isnt 'video'
                return

            url = entry.url
            m = url.match(/itag=(\d+)/) or url.match(/googleusercontent.*=m(\d+)$/)
            if m
                itag = m[1]
            else
                return

            if itag not of ITAG_QMAP
                return

            videos[ITAG_QMAP[itag]].push(
                itag: itag
                contentType: ITAG_CMAP[itag]
                link: url
            )
        )

        data =
            id: id
            type: 'google+'
            title: title
            duration: duration
            meta:
                thumbnail: thumbnails[thumbnails.length - 1].url
                direct: videos

        return new Media(data)
    )

exports.parseUrl = (url) ->
    m = url.match(/^gp:(\d+_\d+_\d+)$/)
    if m
        return {
            type: 'google+'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url, true)

    if data.hostname isnt 'plus.google.com'
        return null

    m = data.pathname.match(/(?:u\/\d+\/)?photos\/(\d+)\/albums\/(\d+)\/(\d+)/)
    if m
        return {
            type: 'google+'
            kind: 'single'
            id: m.slice(1, 4).join('_')
        }

    return null
