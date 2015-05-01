urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'

###
# An itag is an integer value that specifies the codec, quality, and bitrate
# for a Google-hosted video (for example, 22 is 720p MP4).  Selected values
# are mapped to their quality level and content type below.
#
# From an analysis of over 7,000 Google+ video links (thanks, Xaekai) it appears
# that only itags 18, 22, 34, 35, and 37 appear in the wild, but it can't hurt
# to identify more preferable itags when they are available.
###
ITAG_QMAP =
    37: 1080
    46: 1080
    22: 720
    45: 720
    59: 480
    44: 480
    35: 480
    18: 360
    43: 360
    34: 360

ITAG_CMAP =
    43: 'webm'
    44: 'webm'
    45: 'webm'
    46: 'webm'
    18: 'mp4'
    22: 'mp4'
    37: 'mp4'
    59: 'mp4'
    35: 'flv'
    34: 'flv'

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
            m = url.match(/itag=(\d+)/) or url.match(/googleusercountent.*m=(\d+)$/)
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
    m = url.match(/^gp:(\d+_\d+_\d+)/)
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
            id: m.slice().join('_')
        }

    return null
