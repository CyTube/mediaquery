urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'

module.exports = class LivestreamComStream extends Media
    type: 'livestream.com'

    shortCode: 'li'

    fetch: (opts = {}) ->
        # This URL schema... wtf
        url = "http://x#{@id}x.api.channel.livestream.com/2.0/info.json"
        return getJSON(url).then((result) =>
            @title = "Livestream.com - #{result.channel.title}"
            @duration = 0
            @meta.thumbnail = "https://thumbnail.api.livestream.com/thumbnail?name=#{@id}"
            return this
        )

###
# > LivestreamComStream.parseURL('http://original.livestream.com/asdf?foo=bar')
# {id: 'asdf', type: 'livestream.com'}
# > LivestreamComStream.parseURL('http://livestream.com/blah')
# {id: 'blah', type: 'livestream.com'}
###
LivestreamComStream.parseURL = (url) ->
    data = urlparse.parse(url)

    if data.hostname in ['livestream.com', 'www.livestream.com', 'original.livestream.com']
        return {
            type: LivestreamComStream.prototype.type
            id: data.pathname.substring(1)
        }
    else
        return null
