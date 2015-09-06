## YouTubeVideo ##

`type`: `'youtube'`

`shortCode`: `'yt'`

`fetch()` options:

Option | Description
-------|------------
`failNonEmbeddable` | If `true`, `fetch()` will reject with an error message when the video is not embeddable.

`meta` fields:

Field | Description
------|-----------
`thumbnail` | URL to a thumbnail image for the video
`blockedCountries` | A list of 2-letter country codes where this video is not allowed to be played
`allowedCountries` | A list of 2-letter country codes where this video is allowed to be played.  In all other countries, it is blocked.
`notEmbeddable` | If set to `true`, then this video cannot be embedded outside of youtube.com

Accepted URLs:

  * `https://youtu.be/<video id>`
  * `https://youtube.com/watch?v=<video id>`
  * `https://www.youtube.com/watch?v=<video id>`

Notes:

  * The YouTube v3 Data API requires an API key.
  * If neither `blockedCountries` nor `allowedCountries` is present in the
    `meta` object, then there are no country restrictions for this video.
  * If a video has been deleted or is private, the YouTube API does not return a
    response.  In this case, `fetch()` rejects with an error message stating
    that the video does not exist or is private.
  * If the video's upload status is `'failed'`, `'rejected'`, or `'deleted'`,
    `fetch()` will reject.
  * The YouTube API may not always return the exact same duration as you see
    when watching the video, due to rounding errors.  It may be 1 second longer
    or shorter than the actual video.
