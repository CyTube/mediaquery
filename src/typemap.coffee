typeList = [
    'youtube-video'
    'vimeo-video'
    'dailymotion-video'
    'googledrive-video'
    'googleplus-video'
    'soundcloud-track'

    'twitch-stream'
    'livestream.com-stream'
    'hitbox-stream'
    'ustream-stream'

    'youtube-playlist'
]

for type in typeList
    constructor = require "./types/#{type}"
    exports[constructor.prototype.type] = constructor
    exports[constructor.prototype.shortCode] = constructor
