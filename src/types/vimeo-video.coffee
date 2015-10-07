urlparse = require 'url'
Promise = require 'bluebird'
{ OAuth } = require 'oauth'

request = require '../request'
Media = require '../media'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0'
OAUTH_OLD_REQUEST_TOKEN = 'https://vimeo.com/oauth/request_token'
OAUTH_OLD_ACCESS_TOKEN = 'https://vimeo.com/oauth/access_token'
OAUTH_OLD_VERSION = '1.0'
OAUTH_OLD_SIGNATURE_METHOD = 'HMAC-SHA1'
ERR_NOT_EMBEDDABLE = 'The uploader has not made this video embeddable.'
ERR_UNAVAILABLE = 'This video is not available.'

module.exports = class VimeoVideo extends Media
    type: 'vimeo'

    shortCode: 'vi'

    oauth: null

    fetch: (opts = {}) ->
        if @oauth
            if @oauth.useOldAPI
                return @_fetchOldAPI(opts)
            else
                return @_fetchNewAPI(opts)

        url = "https://vimeo.com/api/v2/video/#{@id}.json"
        return request.getJSON(url).then((result) =>
            video = result[0]

            @title = video.title
            @seconds = video.duration
            @meta.thumbnail = video.thumbnail_large

            if opts.extract
                return @extract()

            return this
        )

    _fetchNewAPI: (opts = {}) ->
        url = "https://api.vimeo.com/videos/#{@id}"
        headers =
            Authorization: "bearer #{@oauth}"

        return request.request(url, headers).then((res) =>
            try
                video = JSON.parse(res.data)
            catch e
                throw new Error("Vimeo response could not be decoded as JSON: #{e}")

            if video.privacy.embed isnt 'public'
                if opts.failNonEmbeddable
                    throw new Error(ERR_NOT_EMBEDDABLE)
                else
                    @meta.notEmbeddable = true

            if video.status isnt 'available'
                throw new Error(ERR_UNAVAILABLE + " (status: #{video.status})")

            @title = video.name
            @seconds = video.duration
            @meta.thumbnail = video.pictures[0].link

            if opts.extract
                return @extract()

            return this
        )

    ###
    # Fetch video metadata using the now-deprecated old version of
    # Vimeo's OAuth API.  It's no longer possible to register new applications
    # to use it, but the credentials for existing applications still work.
    # It's still useful to use this in some cases as it can retrieve
    # metadata for private videos that allow embedding.
    ###
    _fetchOldAPI: (opts = {}) ->
        client = new OAuth(
            OAUTH_OLD_REQUEST_TOKEN,
            OAUTH_OLD_ACCESS_TOKEN,
            @oauth.consumerKey,
            @oauth.secret,
            OAUTH_OLD_VERSION,
            null,
            OAUTH_OLD_SIGNATURE_METHOD
        )

        url = "https://vimeo.com/api/rest/v2?format=json\
               &method=vimeo.videos.getInfo&video_id=#{@id}"
        return new Promise((resolve, reject) =>
            client.get(url, null, null, (err, data) =>
                if err
                    return reject(err)

                try
                    data = JSON.parse(data)
                catch e
                    return reject(
                        new Error("Vimeo response could not be decoded as JSON: #{e}"))

                if data.stat isnt 'ok'
                    return reject(new Error("Vimeo returned error: #{data.err.msg}"))

                video = data.video[0]
                if video.embed_privacy isnt 'anywhere'
                    if opts.failNonEmbeddable
                        return reject(new Error(ERR_NOT_EMBEDDABLE))
                    else
                        @meta.notEmbeddable = true

                thumbnails = video.thumbnails.thumbnail
                @meta.thumbnail = thumbnails[thumbnails.length - 1]._content
                # > returns JSON payload
                # > everything is a string
                # ishygddt
                @seconds = parseInt(video.duration, 10)
                @title = video.title

                if opts.extract
                    return resolve(@extract())

                resolve(this)
            )
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

VimeoVideo.setAPIKey = (oauth) ->
    VimeoVideo.prototype.oauth = oauth

###
# > VimeoVideo.parseURL(require('url').parse('https://vimeo.com/59859181', true))
# {type: 'vimeo', id: '59859181'}
# > VimeoVideo.parseURL(require('url').parse('https://vimeo.com/staff', true))
# null
###
VimeoVideo.parseURL = (url) ->
    data = urlparse.parse(url)

    if data.hostname isnt 'vimeo.com'
        return null

    if not data.pathname.match(/^\/\d+$/)
        return null

    return {
        type: VimeoVideo.prototype.type
        id: data.pathname.replace(/^\//, '')
    }
