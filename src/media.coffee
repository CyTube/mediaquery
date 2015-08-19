Promise = require 'bluebird'

class Media
    constructor: (@id) ->
        @title = ''
        @duration = 0
        @meta = {}
        # Copy prototype 'type' field onto this object.
        # Necessary for this field to show up in JSON.stringify'd object.
        @type = @type

    type: ''

    fetch: (opts) ->
        return Promise.resolve(this)

    extract: ->
        return Promise.resolve(this)

    fromExistingData: (data) ->
        { @id, @title, @duration, @meta } = data
        return this

Media.parseUrl = (url) ->
    return null

module.exports = Media
