Promise = require 'bluebird'

TYPE_MAP = require './typemap'
parseUrl = require './parseUrl'

exports.lookupByParsedInfo = (info, opts = {}) ->
    constructor = TYPE_MAP[info.type]
    return new constructor(info.id).fetch(opts)

exports.lookupByUrl = (url, opts = {}) ->
    info = parseUrl(url)
    if not info
        return Promise.reject(new Error("Unable to parse URL: #{url}"))

    return exports.lookupByParsedInfo(info, opts)
