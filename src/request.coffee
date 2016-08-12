http = require 'http'
https = require 'https'
urlparse = require 'url'
Promise = require 'bluebird'
require 'status-message-polyfill'

exports.request = request = (url, options = {}) ->
    return new Promise((resolve, reject) ->
        parsed = urlparse.parse(url)
        if not parsed.protocol?.match(/^https?:$/)
            return reject(new Error("Invalid protocol '#{parsed.protocol}'"))

        transport = if parsed.protocol is 'https:' then https else http
        for key, val of options
            parsed[key] = val
        req = transport.get(parsed, (res) ->
            buffer = ''
            res.on('data', (data) ->
                buffer += data
            )

            res.on('end', ->
                res.data = buffer
                resolve(res)
            )
        )

        req.on('error', (err) ->
            reject(err)
        )
    )

exports.getJSON = getJSON = (url, options = {}) ->
    return request(url).then((res) ->
        switch res.statusCode
            when 400, 403, 404, 500, 503 then \
                if not options.skipStatusCheck or
                        res.statusCode not in options.skipStatusCheck
                    throw new Error(res.statusMessage)

        try
            data = JSON.parse(res.data)
        catch e
            throw new Error('Response could not be decoded as JSON')

        return data
    )

exports.__testpatch = (newRequest) ->
    exports._request = exports.request
    exports.request = request = newRequest

exports.__untestpatch = ->
    exports.request = request = exports._request
