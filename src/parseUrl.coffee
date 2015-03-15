providers = [
    require './provider/youtube'
    require './provider/vimeo'
    require './provider/dailymotion'
]

module.exports = (url) ->
    for provider in providers
        result = provider.parseUrl(url)
        if result isnt null
            return result
    return null
