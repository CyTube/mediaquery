fs = require 'fs'
path = require 'path'
Promise = require 'bluebird'

PROVIDERS =
    youtube: require './provider/youtube'
    vimeo: require './provider/vimeo'
    dailymotion: require './provider/dailymotion'
    googledrive: require './provider/googledrive'
    'google+': require './provider/googleplus'
    vidme: require './provider/vidme'

module.exports = (info) ->
    if not info?
        return Promise.reject(new Error('No information provided'))

    if info.type not of PROVIDERS
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
