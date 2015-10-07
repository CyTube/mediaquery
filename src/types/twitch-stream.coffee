urlparse = require 'url'
Promise = require 'bluebird'

{ getJSON } = require '../request'
Media = require '../media'

module.exports = class TwitchStream extends Media
    type: 'twitch'

    shortCode: 'tw'

    fetch: (opts = {}) ->
        url = "https://api.twitch.tv/kraken/channels/#{@id}"

        return getJSON(url).then((result) =>
            if result.error
                return Promise.reject(new Error("Twitch error: #{result.error}"))

            @title = "Twitch.tv - #{@id}"
            @meta.thumbnail = result.video_banner
            return this
        )

###
# > TwitchStream.parseURL(require('url').parse('https://www.twitch.tv/somechannel?foo=bar', true))
# {id: 'somechannel', type: 'twitch'}
# > TwitchStream.parseURL(require('url').parse('http://twitch.tv/foobar', true))
# {id: 'foobar', type: 'twitch'}
###
TwitchStream.parseURL = (data) ->
    if data.hostname in ['twitch.tv', 'www.twitch.tv']
        return {
            type: TwitchStream.prototype.type
            id: data.pathname.substring(1)
        }
    else
        return null
