fs = require 'fs'
path = require 'path'

PROVIDERS = fs.readdirSync(path.resolve(__dirname, './provider')).filter((provider) ->
    provider.match(/\.js$/)
).map((provider) ->
    require "./provider/#{provider.replace(/\.js$/, '')}"
)

module.exports = (url) ->
    for provider in PROVIDERS
        result = provider.parseUrl(url)
        if result isnt null
            return result
    return null
