clone = require 'clone'
Promise = require 'bluebird'

class Media
    constructor: (@id) ->
        @title = ''
        @duration = 0
        @meta = {}
        # Copy 'type' field from the prototype onto this object.
        @type = @type

    type: ''

    shortCode: ''

    fetch: (opts) ->
        return Promise.resolve(this)

    extract: ->
        return Promise.resolve(this)

    fromExistingData: (data) ->
        { @id, @title, @duration } = data
        @meta = clone(data.meta)
        return this

    toJSON: ->
        return {
            id: @id
            title: @title
            duration: @duration
            meta: clone(@meta)
            type: @type
        }

Media.parseURL = (url) ->
    return null

Media.setAPIKey = (apiKey) ->
    return

Media.search = (query, opts) ->
    return {
        nextPage: false
        results: []
    }

module.exports = Media
