Promise = require 'bluebird'

TYPE_MAP = require './typemap'
parseURL = require './parseURL'

exports.lookupByParsedURL = (info, opts = {}) ->
    constructor = TYPE_MAP[info.type]
    return new constructor(info.id).fetch(opts)

exports.lookupByURL = (url, opts = {}) ->
    info = parseURL(url)
    if not info
        return Promise.reject(new Error("Unable to parse URL: #{url}"))

    return exports.lookupByParsedURL(info, opts)
