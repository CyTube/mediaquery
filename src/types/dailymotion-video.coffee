querystring = require 'querystring'
urlparse = require 'url'

{ getJSON } = require '../request'
Media = require '../media'

DM_FIELDS = [
    'title'
    'duration'
    'thumbnail_120_url'
    'allow_embed'
    'status'
].join(',')

module.exports = class DailymotionVideo extends Media
    type: 'dailymotion'

    shortCode: 'dm'

    fetch: (opts = {}) ->
        @id = @id.split('_')[0]

        params = "?fields=#{DM_FIELDS}"
        url = "https://api.dailymotion.com/video/#{@id}#{params}"

        return getJSON(url).then((result) =>
            if result.status isnt 'published'
                return Promise.reject(new Error('Video status is not published'))

            if not result.allow_embed
                if opts.failNonEmbeddable
                    return Promise.reject(new Error('The uploader has made this video
                                                     non-embeddable'))
                else
                    @meta.notEmbeddable = true

            { @title, @duration } = result
            @meta.thumbnail = result.thumbnail_120_url
            return this
        )

###
# > DailymotionVideo.parseURL('http://www.dailymotion.com/video/x2j9c73_watch-nasa-test-the-largest-most-powerful-rocket-booster-ever-built_travel')
# {id: 'x2j9c73', type: 'dailymotion'}
###
DailymotionVideo.parseURL = (url) ->
    data = urlparse.parse(url)

    if data.hostname not in ['www.dailymotion.com', 'dailymotion.com']
        return null

    m = data.pathname.match(/^\/video\/([a-zA-Z0-9]+)/)
    if not m
        return null

    return {
        type: DailymotionVideo.prototype.type
        id: m[1]
    }
