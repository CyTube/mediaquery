urlparse = require 'url'

request = require '../request'
Media = require '../media'

exports.lookup = (id) ->
    return request.getJSON("https://api.twitch.tv/kraken/videos/#{id}").then((result) ->
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
