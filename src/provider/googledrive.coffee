querystring = require 'querystring'

{ request } = require '../request'
Media = require '../media'
{ ITAG_QMAP, ITAG_CMAP } = require '../util/itag'

exports.lookup = lookup = (id) ->
    url = "https://docs.google.com/file/d/#{id}/get_video_info?sle=true"

    return request(url).then((res) ->
        if res.statusCode != 200
            throw new Error("Google Drive lookup failed: #{res.statusMessage}")

        doc = querystring.parse(res.data)

        if doc.status isnt 'ok'
            if doc.reason.match(/Unable to play this video at this time/)
                reason =
                    'Google Drive does not permit videos longer than 1 hour to be played'
            else if doc.reason.match(/You must be signed in to access/)
                reason = 'Google Drive videos must be shared publicly'
            else
                reason = doc.reason

            throw new Error(reason)

        videos =
            1080: []
            720: []
            480: []
            360: []

        doc.fmt_stream_map.split(',').forEach((source) ->
            [itag, url] = source.split('|')
            itag = parseInt(itag, 10)

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
            type: 'googledrive'
            title: doc.title
            duration: parseInt(doc.length_seconds, 10)
            meta:
                thumbnail: doc.iurl
                direct: videos

        return new Media(data)
    )
