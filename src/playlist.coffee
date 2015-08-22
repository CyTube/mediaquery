module.exports = class Playlist
    type: ''

    shortCode: ''

    constructor: (@id) ->
        @items = []
        @totalDuration = 0
        @type = @type

    fetch: (opts) ->
        return Promise.resolve(this)

    fromExistingData: (data) ->
        { @id, @totalDuration, @items } = data
        return this

Playlist.parseUrl = (url) ->
    return null
