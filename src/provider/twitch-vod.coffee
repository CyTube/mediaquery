urlparse = require 'url'

request = require '../request'
Media = require '../media'

CLIENT_ID = null

exports.lookup = (id) ->
    if not CLIENT_ID
        return Promise.reject(new Error('Client ID not set for Twitch API'))

    return request.getJSON("https://api.twitch.tv/kraken/videos/#{id}",
        headers:
            'Client-ID': CLIENT_ID
    ).then((result) ->
        media = new Media(
            id: id
            title: result.title
            duration: result.length
            type: 'twitchvod'
            meta: {}
        )

        if result.thumbnails.length > 0
            media.meta.thumbnail = result.thumbnails[0].url

        return media
    )

exports.parseUrl = (url) ->
    m = url.match(/^tv:([cv]\d+)$/)
    if m
        return {
            type: 'twitchvod'
            kind: 'single'
            id: m[1]
        }

    data = urlparse.parse(url, true)

    if data.hostname not in ['www.twitch.tv', 'twitch.tv']
        return null

    m = data.pathname.match(/^\/(?:.*?)\/([cv])\/(\d+)/)
    if m
        return {
            type: 'twitchvod'
            kind: 'single'
            id: m[1] + m[2]
        }

    return null

exports.setClientID = (clientID) ->
    CLIENT_ID = clientID
