module.exports = class Playlist
    type: ''

    shortCode: ''

    constructor: (@id) ->
        @items = []
        @totalSeconds = 0
        @type = @type

    fetch: (opts) ->
        return Promise.resolve(this)

    fromExistingData: (data) ->
        { @id, @totalSeconds, @items } = data
        return this

Playlist.parseURL = (url) ->
    return null
