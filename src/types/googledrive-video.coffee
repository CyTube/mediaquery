domutils = require 'domutils'
{ parseDom } = require '../util/xmldom'
querystring = require 'querystring'
urlparse = require 'url'
require 'status-message-polyfill'

request = require '../request'
Media = require '../media'
{ ITAG_QMAP, ITAG_CMAP } = require '../util/itag'

extractHexId = (url) ->
    m = url.match(/vid=([\w-]+)/)
    if m
        return m[1]
    else
        return null

module.exports = class GoogleDriveVideo extends Media
    type: 'googledrive'

    shortCode: 'gd'

    fetch: (opts = {}) ->
        url = "https://docs.google.com/file/d/#{@id}/get_video_info?sle=true"

        return request.request(url).then((res) =>
            if res.statusCode != 200
                throw new Error("Google Drive lookup failed: #{res.statusMessage}")

            doc = querystring.parse(res.data)

            if doc.status isnt 'ok'
                if doc.reason.match(/Unable to play this video at this time/)
                    reason = 'Google Drive does not permit videos longer than
                             1 hour to be played'
                else if doc.reason.match(/You must be signed in to access/)
                    reason = 'Google Drive videos must be shared publicly'
                else
                    reason = doc.reason

                throw new Error(reason)

            @meta.direct =
                1080: []
                720: []
                480: []
                360: []

            doc.fmt_stream_map.split(',').forEach((source) =>
                [itag, url] = source.split('|')
                itag = parseInt(itag, 10)

                if itag not of ITAG_QMAP
                    return

                @meta.direct[ITAG_QMAP[itag]].push(
                    itag: itag
                    contentType: ITAG_CMAP[itag]
                    link: url
                )
            )

            @title = doc.title
            @duration = parseInt(doc.length_seconds, 10)
            @meta.thumbnail = doc.iurl

            if not opts.withSubtitles
                return this

            return @_getSubtitles(extractHexId(doc.ttsurl)).then((subtitles) =>
                if subtitles
                    @meta.gdrive_subtitles = subtitles
                return this
            )
        )

    extract: ->
        return @fetch()

    _getSubtitles: (vid) ->
        params =
            id: @id
            v: @id
            vid: vid
            type: 'list'
            hl: 'en-US'

        url = "https://drive.google.com/timedtext?#{querystring.stringify(params)}"
        return request.request(url).then((res) ->
            if res.statusCode != 200
                throw new Error("Google Drive subtitle lookup failed:
                                #{res.statusMessage}")

            subtitles =
                vid: vid
                available: []

            domutils.findAll((elem) ->
                return elem.name == 'track'
            , parseDom(res.data)).forEach((elem) ->
                subtitles.available.push(
                    lang: elem.attribs.lang_code
                    lang_original: elem.attribs.lang_original
                    name: elem.attribs.name
                )
            )

            return subtitles
        ).catch((err) ->
            console.error(err.stack)
        )

###
# > GoogleDriveVideo.parseURL(require('url').parse('https://drive.google.com/open?id=foo', true))
# {id: 'foo', type: 'googledrive'}
# > GoogleDriveVideo.parseURL(require('url').parse('https://drive.google.com/file/d/foo/edit', true))
# {id: 'foo', type: 'googledrive'}
# > GoogleDriveVideo.parseURL(require('url').parse('https://docs.google.com/file/d/foo/view', true))
# {id: 'foo', type: 'googledrive'}
###
GoogleDriveVideo.parseURL = (url) ->
    data = urlparse.parse(url, true)

    if data.hostname not in ['drive.google.com', 'docs.google.com']
        return null

    m = data.pathname.match(/file\/d\/([\w-]+)/)
    if not m
        if data.pathname == '/open'
            m = data.search.match(/id=([\w-]+)/)

    if m
        return {
            type: GoogleDriveVideo.prototype.type
            id: m[1]
        }

    return null
