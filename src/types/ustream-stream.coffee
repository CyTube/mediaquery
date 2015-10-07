Promise = require 'bluebird'
urlparse = require 'url'

request = require '../request'
Media = require '../media'

module.exports = class UstreamStream extends Media
    type: 'ustream'

    shortCode: 'us'

    fetch: (opts = {}) ->
        return @_resolveId().then((id) =>
            url = "https://api.ustream.tv/channels/#{id}.json"
            return request.getJSON(url).then((stream) =>
                @title = stream.channel.title
                @seconds = 0
                if stream.channel.thumbnail?.live
                    @meta.thumbnail = stream.channel.thumbnail.live
                return this
            )
        )

    _resolveId: ->
        url = "http://www.ustream.tv/#{@id}"
        return request.request(url).then((res) =>
            if res.statusCode != 200
                return Promise.reject(new Error("Ustream returned HTTP #{res.statusCode}
                                                 #{res.statusMessage}"))

            m = res.data.match(/cid=(\d+)/)
            if not m
                return Promise.reject(new Error('Unable to resolve Ustream channel ID'))

            return m[1]
        )

###
# > UstreamStream.parseURL(require('url').parse('https://ustream.tv/blah', true))
# {id: 'blah', type: 'ustream'}
# > UstreamStream.parseURL(require('url').parse('http://www.ustream.tv/channel/foo', true))
# {id: 'channel/foo', type: 'ustream'}
# > UstreamStream.parseURL(require('url').parse('http://ustream.tv/blah/other/thing', true))
# null
###
UstreamStream.parseURL = (data) ->
    if data.hostname not in ['ustream.tv', 'www.ustream.tv']
        return null

    if not data.pathname.match(/^(\/channel)?\/[\w-]+$/)
        return null

    return {
        type: UstreamStream.prototype.type
        id: data.pathname.substring(1)
    }
