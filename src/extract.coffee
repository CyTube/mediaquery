Promise = require 'bluebird'

{ providerMap } = require './provider-map'

module.exports = (info) ->
    if not info?
        return Promise.reject(new Error('No information provided'))

    if info.kind != 'single'
        return Promise.reject(new Error('extract() is only supported for single items'))

    if info.type not of providerMap
        return Promise.reject(new Error("Unknown provider '#{info.type}'"))

    provider = providerMap[info.type]
    return provider.extract(info.id)
