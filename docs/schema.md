# Schema #

## `Media` ##

All returned `Media` objects have the following fields:

```
{
    id: string,
    title: string,
    duration: number,
    meta: object,
    type: string
}
```

**Notes**

  * `id` is a unique identifier *per media type*, but is not necessarily
    globally unique.  It generally represents the identifier used to retrieve
    data about the `Media` from the respective API.
  * `title` is not sanitized or escaped.  If you intend to display it in HTML,
    you will need to escape it accordingly.  It could also be very long,
    depending on what the API returns (for example, [this YouTube
    video](https://developers.google.com/apis-explorer/?hl=en_US#p/youtube/v3/youtube.videos.list?part=snippet&id=PKbbOq0bNvE&_h=3&)
    has an extremely long title).
  * `duration` will be set to `0` for livestreams media types.
  * `meta` will always be present, but may have no keys.  All fields in `meta`
    are optional, and may vary depending on which API is being queried.

## `Playlist` ##

All returned `Playlist` objects have the following fields:

```
{
    id: string,
    totalDuration: number,
    items: list<Media>,
    type: string
}
```
