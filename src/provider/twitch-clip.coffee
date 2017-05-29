urlparse = require 'url'

request = require '../request'
Media = require '../media'

CLIENT_ID = null

exports.lookup = (id) ->
    if not CLIENT_ID
        return Promise.reject(new Error('Client ID not set for Twitch API'))

    return request.getJSON("https://api.twitch.tv/kraken/clips/#{id}",
        headers:
            'Client-ID': CLIENT_ID
            'Accept': 'application/vnd.twitchtv.v5+json'
    ).then((result) ->
        media = new Media(
            id: id
            title: result.title
            duration: result.duration
            type: 'twitchclip'
            meta: {}
        )

        if result.thumbnails
            media.meta.thumbnail = result.thumbnails.medium

        return media
    ).then((media) ->
        return request.getJSON("https://clips.twitch.tv/api/v2/clips/#{id}/status").then((result) ->
            videos =
                1080: []
                720: []
                480: []
                360: []

            result.quality_options.forEach((opt) ->
                if opt.quality of videos
                    videos[opt.quality].push(
                        link: opt.source
                        contentType: 'video/mp4'
                    )
            )

            media.meta.direct = videos
            return media
        )
    )

exports.parseUrl = (url) ->
    m = url.match(/^tc:([A-Za-z]+)$/)
    if m
        return {
            type: 'twitchclip'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url, true)

    if data.hostname not in ['clips.twitch.tv']
        return null

    m = data.pathname.match(/^\/([A-Za-z]+)$/)
    if m
        return {
            type: 'twitchclip'
            kind: 'single'
            id: m[1]
        }

    return null

exports.setClientID = (clientID) ->
    CLIENT_ID = clientID
