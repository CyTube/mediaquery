###
# An itag is an integer value that specifies the codec, quality, and bitrate
# for a Google-hosted video (for example, 22 is 720p MP4).  Selected values
# are mapped to their quality level and content type below.
#
# Values are taken from a sample of 8,381 Google Drive links.  From a sample
# of over 7,000 Google+ video links, those appear not to have WebM videos
# available, but make use of the same MP4 and FLV itags.
#
# itag 59 is not documented on Wikipedia's table of YouTube codecs, but it
# corresponds to 480p MP4
###
exports.ITAG_QMAP =
    37: 1080
    46: 1080
    22: 720
    45: 720
    59: 480
    44: 480
    35: 480
    18: 360
    43: 360
    34: 360

exports.ITAG_CMAP =
    43: 'webm'
    44: 'webm'
    45: 'webm'
    46: 'webm'
    18: 'mp4'
    22: 'mp4'
    37: 'mp4'
    59: 'mp4'
    35: 'flv'
    34: 'flv'
