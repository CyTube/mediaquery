http = require 'http'
https = require 'https'
urlparse = require 'url'
Promise = require 'bluebird'
{ spawn } = require 'child_process'

Media = require '../media'

ERR_INVALID_PROTOCOL = 'Only links beginning with http:// or https:// are allowed.'
ERR_INVALID_LINK = 'Please provide a properly formatted URL.'
ERR_INVALID_DURATION = 'Returned media file is missing the length field.'
ERR_TOO_MANY_REDIRECTS = 'Too many redirects encountered when attempting to retrieve
                          link.  Please provide a direct link.'
ERR_WRONG_CONTENT_TYPE = 'The remote server did not send a Content-Type header indicating
                          that the file is a video or audio file.  If this is your server,
                          please check that your server is configured to serve video and
                          audio files with the correct Content-Type.'

VALID_CONTENT_TYPE = /^(audio|video)/
JSON_NOT_SUPPORTED = /unrecognized option|json/i
FFPROBE_TLS_ERROR = /the tls connection was non-properly terminated/i
USE_JSON = true

module.exports = class FFmpegVideo extends Media
    type: 'ffmpeg'

    shortCode: 'fi'

    acceptedVideoCodecs: [
        'mov/h264' # Misleading, actually MP4 container
        'flv/h264'
        'matroska/vp8' # WebM
        'matroska/vp9' # WebM
        'ogg/theora'
    ]

    acceptedAudioCodecs: [
        'mp3/mp3'
        'ogg/vorbis'
    ]

    fileExtensionRegex: /\.(mp4|flv|webm|ogv|mov|mp3|ogg)$/

    timeout: 30

    ffprobeExecutable: 'ffprobe'

    fetch: (opts = {}) ->
        return @_preTestLink(@id).then(@_runFFprobe.bind(this))

    ###
    # Test that the link actually exists and has the correct content-type
    # before calling ffprobe.  This allows reporting more useful error
    # messages.
    ###
    _preTestLink: (link, redirectCount = 0) ->
        data = urlparse.parse(link)
        if not /^https?:$/.test(data.protocol)
            return Promise.reject(new Error(ERR_INVALID_PROTOCOL))

        if not data.hostname
            return Promise.reject(new Error(ERR_INVALID_LINK))

        options =
            host: data.hostname
            port: data.port
            method: 'HEAD' # Don't need the response, just the headers
            path: data.path

        transport = if data.protocol is 'https:' then https else http

        return new Promise((resolve, reject) =>
            req = transport.request(options, (res) =>
                req.abort()

                if res.statusCode in [301, 302]
                    if redirectCount > 2
                        return reject(new Error(ERR_TOO_MANY_REDIRECTS))
                    else
                        return resolve(@_preTestLink(res.headers['location'],
                                redirectCount + 1))
                else if res.statusCode isnt 200
                    error = res.statusCode
                    if res.statusMessage
                        error += ' ' + res.statusMessage
                    message = res.statusMessage or ''
                    return reject(new Error("#{options.host} returned HTTP error
                                             #{error}"))
                else if not VALID_CONTENT_TYPE.test(res.headers['content-type'])
                    return reject(new Error(ERR_WRONG_CONTENT_TYPE))
                else
                    return resolve()
            )

            req.on('error', (err) ->
                reject(err)
            )

            req.end()
        )

    _runFFprobe: ->
        args = ['-show_streams', '-show_format', @id]
        if USE_JSON
            args = ['-of', 'json'].concat(args)

        child = spawn(@ffprobeExecutable, args)
        stdoutBuffer = ''
        stderrBuffer = ''
        killed = false

        return new Promise((resolve, reject) =>
            if @timeout
                timer = setTimeout(=>
                    killed = true
                    child.kill('SIGKILL')
                    reject(new Error("Retrieving metadata for #{@id}
                            exceeded the timeout of #{@timeout} seconds."))
                , @timeout * 1000)

            child.stdout.on('data', (data) ->
                stdoutBuffer += data
            )

            child.stderr.on('data', (data) ->
                stderrBuffer += data
                if FFPROBE_TLS_ERROR.test(stderrBuffer)
                    killed = true
                    child.kill('SIGKILL')
                    reject(new Error("The remote server closed the TLS connection
                                     unexpectedly"))
            )

            child.on('error', (err) ->
                killed = true
                return reject(err)
            )

            child.on('close', (code) =>
                if killed
                    # Promise will be rejected by timeout handler
                    return

                clearTimeout(timer)
                if code isnt 0
                    if JSON_NOT_SUPPORTED.test(stderrBuffer) and USE_JSON
                        USE_JSON = false
                        return resolve(@_runFFprobe())

                    return reject(new Error("#{@ffprobeExecutable} exited
                            with code #{code}: #{stderrBuffer}"))

                resolve(@_parseFFprobeOutput(stdoutBuffer))
            )
        )

    _parseFFprobeOutput: (text) ->
        if USE_JSON
            data = JSON.parse(text)
        else
            data = @_parseNonJSONOutput(text)

        container = data.format.format_name.split(',')[0]
        duration = parseInt(data.format.duration, 10)
        if isNaN(duration)
            throw new Error(ERR_INVALID_DURATION)
        @duration = Math.ceil(duration)

        # Bitrate is converted from bps to Kbps
        bitrate = Math.ceil(parseInt(data.format.bit_rate, 10) / 1000)
        if not isNaN(bitrate)
            @meta.bitrate = bitrate

        @title =
            if data.format.tags?.title then data.format.tags.title else 'Direct Video'

        for stream in data.streams
            codec = "#{container}/#{stream.codec_name}"
            if stream.codec_type is 'video' and
                    @acceptedVideoCodecs.indexOf(codec) >= 0
                @meta.codec = codec
                @meta.medium = 'video'
            else if stream.codec_type is 'audio' and
                    @acceptedAudioCodecs.indexOf(codec) >= 0
                @meta.codec = codec
                @meta.medium = 'audio'

        if not @meta.codec
            accepted = @acceptedVideoCodecs.concat(@acceptedAudioCodecs)
            throw new Error("No accepted video or audio streams found.  Allowed
                            formats: #{accepted.join(', ')}")

        return this

FFmpegVideo.setFFprobeExecutable = (exe) ->
    FFmpegVideo.prototype.ffprobeExecutable = exe

FFmpegVideo.setAcceptedVideoCodecs = (codecs) ->
    FFmpegVideo.prototype.acceptedVideoCodecs = codecs

FFmpegVideo.setAcceptedAudioCodecs = (codecs) ->
    FFmpegVideo.prototype.acceptedAudioCodecs = codecs

FFmpegVideo.setFileExtensions = (extensionList) ->
    FFmpegVideo.prototype.fileExtensionRegex = new RegExp(
            "\\.(#{extensionList.join('|')})$")

FFmpegVideo.setTimeout = (timeout) ->
    FFmpegVideo.prototype.timeout = timeout

###
# > FFmpegVideo.parseURL(require('url').parse('http://i.4cdn.org/wsg/1441995931069.webm'))
# {id: 'http://i.4cdn.org/wsg/1441995931069.webm', type: 'ffmpeg'}
# > FFmpegVideo.parseURL(require('url').parse('https://youtu.be/asdf'))
# null
###
FFmpegVideo.parseURL = (data) ->
    if not /^https?:/.test(data.protocol)
        return null

    if not FFmpegVideo.prototype.fileExtensionRegex.test(data.pathname)
        return null

    return {
        type: FFmpegVideo.prototype.type
        id: data.href
    }
