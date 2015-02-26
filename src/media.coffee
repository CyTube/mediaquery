class Media
    constructor: (data) ->
        @id = data.id
        @type = data.type
        @title = data.title
        @duration = data.duration
        @meta = if data.meta? then data.meta else {}

module.exports = Media
