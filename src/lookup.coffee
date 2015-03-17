fs = require 'fs'
path = require 'path'
Promise = require 'bluebird'

PROVIDERS = {}
fs.readdirSync(path.resolve(__dirname, './provider')).filter((provider) ->
    provider.match(/\.js$/)
).map((provider) ->
    name = provider.replace(/\.js$/, '')
    PROVIDERS[name] = require "./provider/#{name}"
)

module.exports = (info) ->
    if not info?
        return Promise.reject(new Error('No information provided'))

    if not info.type of PROVIDERS
        return Promise.reject(new Error("Unknown provider '#{info.type}'"))

    provider = PROVIDERS[info.type]

    switch info.kind
        when 'single' then provider.lookup(info.id)
        when 'playlist'
            if 'lookupPlaylist' of provider
                provider.lookupPlaylist(info.id)
            else
                Promise.reject(new Error("Provider '#{info.type}' does not support playlists"))
        else Promise.reject(new Error("Unknown info kind '#{info.kind}'"))
