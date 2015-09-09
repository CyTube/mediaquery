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
`notEmbeddable` | If `true`, then this video cannot be embedded outside of youtube.com

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

## VimeoVideo ##

`type`: `'vimeo'`

`shortCode`: `'vi'`

`fetch()` options:

Option | Description
-------|------------
`failNonEmbeddable` | If `true`, `fetch()` will reject with an error message when the video is not embeddable.
`extract` | If `true`, `fetch()` will also call `extract()` to retrieve direct video links.

`meta` fields:

Field | Description
------|-----------
`thumbnail` | URL to a thumbnail image for the video
`notEmbeddable` | If `true`, then this video cannot be embedded outside of vimeo.com
`direct` | A map of quality levels to available video links.  See [Direct Links].  Only present if `fetch()` is passed with `{extract: true}` or `extract()` is called.

Accepted URLs:

  * `https://vimeo.com/<video id>`

Notes:

  * Vimeo lookups do not require an API key, however you can optionally set one
    to use the authenticated API.
      - To use the old (deprecated) API:
        1. Go to https://developer.vimeo.com/
        2. Click on "OAuth" (must have registered your application back when
           this API was active)
        3. Note your Client ID and Client Secret
        4. Set the API information:
        ```javascript
        VimeoVideo.setApiKey({
            useOldAPI: true,
            consumerKey: <client ID>
            secret: <client secret>
        });
        ```
      - To use the current API:
        1. Go to https://developer.vimeo.com/
        2. Register a new application
        3. Click on "OAuth2"
        4. Scroll down to "Generate an Access Token", and generate a token
        5. Set the API key to the token:
        ```javascript
        VimeoVideo.setApiKey(<token>);
        ```

## DailymotionVideo ##

`type`: `'dailymotion'`

`shortCode`: `'dm'`

`fetch()` options:

Option | Description
-------|------------
`failNonEmbeddable` | If `true`, `fetch()` will reject with an error message when the video is not embeddable.

`meta` fields:

Field | Description
------|-----------
`thumbnail` | URL to a thumbnail image for the video
`notEmbeddable` | If `true`, then this video cannot be embedded outside of dailymotion.com

Accepted URLs:

  * `https://dailymotion.com/video/<video id>`
  * `https://www.dailymotion.com/video/<video id>`

Notes:

  * Dailymotion includes a bunch of crap after the actual video ID in the URL.
    The video ID is only a few letters and ends at the underscore.  For example,
    for the URL
        `http://www.dailymotion.com/video/x35i94l_the-foo-fighters-played-with-queen-and-led-zeppelin-foo-fighters-under-pressure-john-paul-jones-roge_music`,
        the video ID is `x35i94l`.

[Direct Links]: direct-links.md
