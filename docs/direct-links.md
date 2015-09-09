# Direct Links #

Many media fetchers offer the ability to retrieve direct video/audio links from
the respective provider by calling `extract()` or passing the `extract: true`
option to `fetch()`.  After extraction, the media object will have a
`meta.direct` object.

The `meta.direct` object will have 1 key for each quality that is *potentially*
returned from that provider.  For example, Google Drive's `meta.direct` object
will have keys `[360, 480, 720, 1080]`.  Each key maps to a list of available
files for that quality level (the list may be empty of that quality level is
not available for that video).  Each file has the following format:

```javascript
{
    contentType: 'content type of the media file',
    link: 'URL to the file'
}
```

Google Drive and Google+ files additionally have an `itag` field which specifies
the numeric ID of the encoding format (see
https://en.wikipedia.org/wiki/YouTube#Quality_and_formats)

Example result (Google Drive):
```javascript
"direct": {
    "360": [
        {
            "itag": 18,
            "contentType": "video/mp4",
            "link": "https://r5---sn-nx57yn7r.c.docs.google.com/videoplayback?requiressl=yes&id=e69155668caa53bd&itag=18&source=webdrive&app=docs&ip=162.244.137.144&ipbits=0&expire=1441776218&sparams=requiressl%2Cid%2Citag%2Csource%2Cip%2Cipbits%2Cexpire&signature=49E25B5280E5A4243BF0FA97D0285AB31C1A0834.1088E2294BE635AD8D3EDB1F85E4F3F9CC8FA335&key=ck2&mm=30&mn=sn-nx57yn7r&ms=nxu&mt=1441772582&mv=m&pl=22"
        },
        {
            "itag": 34,
            "contentType": "video/flv",
            "link": "https://r5---sn-nx57yn7r.c.docs.google.com/videoplayback?requiressl=yes&id=e69155668caa53bd&itag=34&source=webdrive&app=docs&ip=162.244.137.144&ipbits=0&expire=1441776218&sparams=requiressl%2Cid%2Citag%2Csource%2Cip%2Cipbits%2Cexpire&signature=321D241FEA617061246BF97F4F18636D39FEB23C.1D8FCB019CEF283C218ABF2FE268D40FE51D4395&key=ck2&mm=30&mn=sn-nx57yn7r&ms=nxu&mt=1441772582&mv=m&pl=22"
        },
        {
            "itag": 43,
            "contentType": "video/webm",
            "link": "https://r5---sn-nx57yn7r.c.docs.google.com/videoplayback?requiressl=yes&id=e69155668caa53bd&itag=43&source=webdrive&app=docs&ip=162.244.137.144&ipbits=0&expire=1441776218&sparams=requiressl%2Cid%2Citag%2Csource%2Cip%2Cipbits%2Cexpire&signature=61BEF88BBF284707E762CB20F35E778CD09B5461.77D7CC0731CE71931745981DFFD7538ABC90C472&key=ck2&mm=30&mn=sn-nx57yn7r&ms=nxu&mt=1441772582&mv=m&pl=22"
        }
    ],
    "480": [
        {
            "itag": 35,
            "contentType": "video/flv",
            "link": "https://r5---sn-nx57yn7r.c.docs.google.com/videoplayback?requiressl=yes&id=e69155668caa53bd&itag=35&source=webdrive&app=docs&ip=162.244.137.144&ipbits=0&expire=1441776218&sparams=requiressl%2Cid%2Citag%2Csource%2Cip%2Cipbits%2Cexpire&signature=5CB26BEC2B9337040589EA689F273560ABD697EA.561D835B39EE022A5FFE9F4DB5B0D27BC2758959&key=ck2&mm=30&mn=sn-nx57yn7r&ms=nxu&mt=1441772582&mv=m&pl=22"
        },
        {
            "itag": 59,
            "contentType": "video/mp4",
            "link": "https://r5---sn-nx57yn7r.c.docs.google.com/videoplayback?requiressl=yes&id=e69155668caa53bd&itag=59&source=webdrive&app=docs&ip=162.244.137.144&ipbits=0&expire=1441776218&sparams=requiressl%2Cid%2Citag%2Csource%2Cip%2Cipbits%2Cexpire&signature=AB6DCC3D1444149503FAD267A55E14AB6EC97082.6C97FC481EDD325F9E84041C9E2C3D9D82DF4D38&key=ck2&mm=30&mn=sn-nx57yn7r&ms=nxu&mt=1441772582&mv=m&pl=22"
        }
    ],
    "720": [],
    "1080": []
}
```
