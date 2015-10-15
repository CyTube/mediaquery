urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'
{ ITAG_QMAP, ITAG_CMAP } = require '../util/itag'

reject = (msg) -> Promise.reject(new Error(msg))

ERR_STILL_PROCESSING = 'The video is still being processed'
ERR_PROCESSING_FAILED = 'Picasaweb failed processing this video'
ERR_PROCESSED_NOT_ACCESSIBLE = 'The video has been processed but is not yet
                                accessible'
ERR_MISSING_DATA = 'Unable to retrieve video information.  Check that the
                    video exists and is shared publicly'

module.exports = class PicasawebVideo extends Media
    type: 'picasaweb'

    shortCode: 'gp'

    fetch: (opts = {}) ->
        [uid, aid, pid] = @id.split('_')
        if not uid or not aid or not pid
            return reject('Invalid Picasaweb video ID')

        url = "https://picasaweb.google.com/data/feed/api/user/#{uid}/albumid/#{aid}/\
              photoid/#{pid}?kind=tag&alt=json"

        return getJSON(url).then((result) =>
            $ = result.feed
            switch $.gphoto$videostatus.$t
                when 'pending' then return reject(ERR_STILL_PROCESSING)
                when 'failed' then return reject(ERR_PROCESSING_FAILED)
                when 'ready' then return reject(ERR_PROCESSED_NOT_ACCESSIBLE)

            if not $.gphoto$originalvideo or not $.media$group or not
                    $.media$group.media$title or not $.media$group.media$content
                return reject(ERR_MISSING_DATA)

            @seconds = $.gphoto$originalvideo.duration
            @title = $.media$group.media$title.$t
            thumbnails = $.media$group.media$thumbnail
            @meta.thumbnail = thumbnails[thumbnails.length - 1].url
            if opts.extract
                @meta.direct =
                    1080: []
                    720: []
                    480: []
                    360: []

                $.media$group.media$content.forEach((entry) =>
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

                    @meta.direct[ITAG_QMAP[itag]].push(
                        itag: itag
                        contentType: ITAG_CMAP[itag]
                        link: url
                    )
                )

            return this
        )

    extract: ->
        return @fetch(extract: true)

###
# > PicasawebVideo.parseURL(require('url').parse('https://plus.google.com/photos/123/albums/456/789/', true))
# {id: '123_456_789', type: 'picasaweb'}
# > PicasawebVideo.parseURL(require('url').parse('https://plus.google.com/u/1/photos/123/albums/456/789/', true))
# {id: '123_456_789', type: 'picasaweb'}
###
PicasawebVideo.parseURL = (data) ->
    # Currently only Google+ links are supported
    if data.hostname isnt 'plus.google.com'
        return null

    m = data.pathname.match(/(?:u\/\d+\/)?photos\/(\d+)\/albums\/(\d+)\/(\d+)/)
    if m
        return {
            type: PicasawebVideo.prototype.type
            id: m.slice(1, 4).join('_')
        }

    return null
