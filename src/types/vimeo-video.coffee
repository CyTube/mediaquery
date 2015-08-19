urlparse = require 'url'
Promise = require 'bluebird'

request = require '../request'
Media = require '../media'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0'

module.exports = class VimeoVideo extends Media
    type: 'vimeo'

    shortCode: 'vi'

    fetch: (opts = {}) ->
        url = "https://vimeo.com/api/v2/video/#{@id}.json"
        return request.getJSON(url).then((result) =>
            video = result[0]

            { @title, @duration } = video
            @meta.thumbnail = video.thumbnail_medium

            if opts.extract
                return @extract()

            return this
        )

    extract: ->
        url = "https://player.vimeo.com/video/#{@id}"
        return request.request(url,
            'User-Agent': USER_AGENT
        ).then((res) =>
            @meta.direct = {}
            if res.statusCode != 200
                return this

            start = res.data.indexOf('{"cdn_url"')
            if start < 0
                return this

            end = res.data.indexOf('};', start)
            data = res.data.substring(start, end+1)

            try
                data = JSON.parse(data)
                videos =
                    720: []
                    360: []
                    240: []

                files = data.request.files.h264
                if not files
                    console.error("vimeo::extract() was missing files for vi:#{id}")
                    return this

                if 'mobile' of files
                    videos[240].push(
                        link: files.mobile.url
                        contentType: 'video/mp4'
                    )
                if 'sd' of files
                    videos[360].push(
                        link: files.sd.url
                        contentType: 'video/mp4'
                    )
                if 'hd' of files
                    videos[720].push(
                        link: files.hd.url
                        contentType: 'video/mp4'
                    )

                @meta.direct = videos
                return this
            catch e
                if res.data.indexOf('This video does not exist.') >= 0
                    return this
                else if res.data.indexOf('Because of its privacy settings, this video
                                         cannot be played here') >= 0
                    return this
                console.error("vimeo::extract() failed for vi:#{@id} : #{e.stack}")
                return this
        )

###
# > VimeoVideo.parseUrl('https://vimeo.com/59859181')
# {type: 'vimeo', id: '59859181'}
# > VimeoVideo.parseUrl('https://vimeo.com/staff')
# null
###
VimeoVideo.parseUrl = (url) ->
    data = urlparse.parse(url)

    if data.hostname isnt 'vimeo.com'
        return null

    if not data.pathname.match(/^\/\d+$/)
        return null

    return {
        type: VimeoVideo.prototype.type
        id: data.pathname.replace(/^\//, '')
    }
