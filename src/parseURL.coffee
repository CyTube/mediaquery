fs = require 'fs'
path = require 'path'
urlparse = require 'url'

TYPE_MAP = require './typemap'

module.exports = (url) ->
    if typeof url isnt 'string'
        return null

    m = url.match(/([a-z]+):(.*)/)
    if m and m[1] of TYPE_MAP
        return {
            id: m[2],
            type: TYPE_MAP[m[1]].prototype.type
        }

    parsed = urlparse.parse(url, true)
    for _, type of TYPE_MAP
        result = type.parseURL(parsed, true)
        if result isnt null
            return result

    return null
