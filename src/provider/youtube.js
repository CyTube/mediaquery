import { getJSON, request } from '../request';
import Media from '../media';
import { parseDuration } from '../util/isoduration';

import { Counter } from 'prom-client';

const LOGGER = require('@calzoneman/jsli')('mediaquery/youtube');
// Technically the internal CyTube playlist limit is 4000, but even 2000 starts
// to lag the UI pretty badly and will take at least 40 requests to the YouTube
// API to load (50 per page).
const PLAYLIST_ITEM_LIMIT = 2000;

let API_KEY = null;
let CACHE = null;

const cacheAttemptCount = new Counter({
    name: 'cytube_yt_cache_attempt_count',
    help: 'Number of video lookups eligible for YouTube cache'
});
const cacheFoundCount = new Counter({
    name: 'cytube_yt_cache_found_count',
    help: 'Number of video lookups with a result in the cache'
});
const cacheHitCount = new Counter({
    name: 'cytube_yt_cache_hit_count',
    help: 'Number of video lookups served using the cached result'
});

/*
 * Retrieve metadata for a single YouTube video.
 *
 * Returns a Media object
 */
export async function lookup(id) {
    let cached = null;
    if (CACHE !== null) {
        try {
            cacheAttemptCount.inc();
            cached = await CACHE.get(id, 'yt');
            if (cached !== null) {
                cacheFoundCount.inc();
            }
        } catch (error) {
            LOGGER.error('Error retrieving cached metadata for yt:%s - %s', id, error.stack);
        }
    }

    // XXX: consider merging lookupInternal and lookupMany, the only difference
    // is caching.
    let media = await _lookupInternal(id, cached);
    if (CACHE !== null) {
        try {
            await CACHE.put(media);
        } catch (error) {
            LOGGER.error('Error updating cached metadata for yt:%s - %s', id, error.stack);
        }
    }

    return media;
}

function getErrorReason(body) {
    try {
        body = JSON.parse(body);
    } catch (error) {
        return null;
    }

    if (!body.error || !body.error.errors) return null;

    return body.error.errors[0].reason;
}

function map403Error(body) {
    switch (getErrorReason(body)) {
        case 'dailyLimitExceeded':
        case 'quotaExceeded':
            return new Error(
                'YouTube videos are temporarily unavailable due to the website ' +
                'exceeding the YouTube API quota.  ' +
                'Quota resets daily at midnight Pacific Time'
            );
        case 'accessNotConfigured':
            return new Error(
                'The YouTube API is not properly configured for this website.  ' +
                'See https://console.developers.google.com/apis/api/youtube.googleapis.com/overview'
            );
        default:
            return new Error(
                'Unable to access YouTube API'
            );
    }
}

async function ytRequest(url, headers = {}) {
    const res = await request(url, { headers });
    switch (res.statusCode) {
        case 304:
            cacheHitCount.inc();
            return cached;
        case 400:
            LOGGER.error('YouTube API returned Bad Request: %s', res.data);
            throw new Error('Error calling YouTube API: Bad Request');
        case 403:
            LOGGER.error('YouTube API returned Forbidden: %s', res.data);
            throw map403Error(res.data);
        case 500:
        case 503:
            throw new Error('YouTube API is unavailable.  Please try again later.');
        default:
            if (res.statusCode !== 200) {
                throw new Error(`Error calling YouTube API: HTTP ${res.statusCode}`);
            }
            break;
    }

    try {
        return JSON.parse(res.data);
    } catch (error) {
        LOGGER.error(
            'YouTube API returned non-JSON response: %s',
            String(res.data).substring(0, 1000)
        );
        throw new Error('Error calling YouTube API: could not decode response as JSON');
    }
}

function _lookupInternal(id, cached) {
    if (!API_KEY) {
        return Promise.reject(new Error('API key not set for YouTube v3 API'));
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails,status,snippet,liveStreamingDetails',
        id
    });

    let headers = {};
    if (cached !== null && cached.meta.etag) {
        headers = {
            'If-None-Match': cached.meta.etag
        };
    }

    return ytRequest(url, { headers }).then(res => {
        // Sadly, as of the v3 API, YouTube doesn't tell you *why* the request failed.
        if (res.items.length === 0) {
            throw new Error('Video does not exist or is private');
        }

        const video = res.items[0];
        return videoToMedia(video, res.etag ?? null);
    });
}

function videoToMedia(video, etag = null) {
    if (!video.status || !video.contentDetails || !video.snippet) {
        LOGGER.info('Incomplete video; assuming deleted video with id=%s', video.id);
        throw new Error('This video is unavailable');
    }

    if (!video.status.embeddable) {
        throw new Error('The uploader has made this video non-embeddable');
    }

    switch (video.status.uploadStatus) {
        case 'deleted':
            throw new Error('This video has been deleted');
        case 'failed':
            throw new Error(
                'This video is unavailable: ' +
                video.status.failureReason
            );
        case 'rejected':
            throw new Error(
                'This video is unavailable: ' +
                video.status.rejectionReason
            );
        case 'processed':
            break;
        case 'uploaded':
            // For VODs, we must wait for 'processed' before the video
            // metadata is correct.  For livestreams, the status is
            // 'uploaded' while the stream is live, and the metadata
            // is presumably correct (we don't care about duration
            // for livestreams anyways)
            // See calzoneman/sync#710
            //
            // Sometimes, Youtube fails to set the status of a stream
            // to live. However, we can check if 'actualStartTime' is
            // present in the stream details to know it has started,
            // and 'actualEndTime' to know it's ended.
            if (video.snippet.liveBroadcastContent !== 'live' &&
                (!video.liveStreamingDetails?.actualStartTime || video.liveStreamingDetails?.actualEndTime)) {
                throw new Error(
                    'This video has not been processed yet.'
                );
            }
            break;
        default:
            throw new Error(
                'This video is not available ' +
                `(status=${video.status.uploadStatus})`
            );
    }

    const data = {
        id: video.id,
        type: 'youtube',
        title: video.snippet.title,
        duration: parseDuration(video.contentDetails.duration),
        meta: {
            thumbnail: video.snippet.thumbnails.default.url
        }
    };

    if (etag !== null) {
        data.meta.etag = etag;
    }

    if (video.contentDetails.regionRestriction) {
        const restriction = video.contentDetails.regionRestriction;
        if (restriction.blocked) {
            data.meta.blocked = restriction.blocked;
        }
        if (restriction.allowed) {
            data.meta.allowed = restriction.allowed;
        }
    }

    if (video.contentDetails.contentRating) {
        const rating = video.contentDetails.contentRating;

        if (rating.ytRating) {
            data.meta.ytRating = rating.ytRating;
        }
    }

    return new Media(data);
}

/*
 * Retrieve metadata for multiple YouTube videos.  As this is intended for use
 * by the search and playlist retrieval, it does not check for failed video IDs.
 * If a video is private, removed, or non-embeddable, its information simply
 * doesn't appear in the results.
 *
 * Returns a list of Media objects
 */
async function lookupMany(ids) {
    if (!API_KEY) {
        throw new Error('API key not set for YouTube v3 API');
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails,status,snippet,liveStreamingDetails',
        id: ids.join(',')
    });

    const res = await ytRequest(url);
    let results = [];
    res.items.forEach(video => {
        try {
            results.push(videoToMedia(video));
        } catch (error) {
            // Skip -- likely a broken/deleted/non-embeddable video.  Let the
            // rest of them be queued still.
            LOGGER.info('Dropping video %s from playlist - %s', video.id, error.message);
        }
    });

    return results;
}

/*
 * Search for YouTube videos.  Optionally provide the ID of the page of results
 * to retrieve.
 *
 * Returns { nextPage: (string: next page token), results: (list of Media) }
 */
export function search(query, nextPage = false) {
    if (!API_KEY) {
        return Promise.reject(new Error('API key not set for YouTube v3 API'));
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams(Object.assign({
        key: API_KEY,
        part: 'id',
        maxResults: 25,
        q: query.replace(/%20/g, '+'),
        type: 'video'
    }, nextPage ? { pageToken: nextPage } : null));

    return getJSON(url).then(result => {
        // https://code.google.com/p/gdata-issues/issues/detail?id=4294
        return lookupMany(result.items.map(item => item.id.videoId)).then(videos => {
            return {
                nextPage: result.nextPageToken || false,
                results: videos
            };
        })
    });
}

/*
 * Retrieve metadata for all items on a YouTube playlist.  For playlists longer
 * than 50 videos, it recurses to retrieve every page of results.
 *
 * Returns a list of Media objects
 */
export async function lookupPlaylist(id) {
    if (!API_KEY) {
        throw new Error('API key not set for YouTube v3 API');
    }

    LOGGER.info('Looking up YouTube playlist %s', id);

    await checkPlaylistMeta(id);

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails',
        maxResults: 50,
        playlistId: id
    });
    let results = [];
    let nextPageToken = null;

    do {
        const res = await ytRequest(url);
        const ids = res.items.map(it => it.contentDetails.videoId);
        if (ids.length > 0) {
            // Annoyingly, the playlistItems endpoint doesn't return the full
            // contentDetails, so we have to go back to videos.list to get the
            // info we need.
            const videos = await lookupMany(ids);
            results.push(...videos);
        }

        nextPageToken = res.nextPageToken ?? null;
        if (nextPageToken !== null) {
            LOGGER.info('Fetching next page of playlist %s, have %d items so far', id, results.length);
            url.searchParams.set('pageToken', nextPageToken);
        }
    } while (nextPageToken !== null && results.length < PLAYLIST_ITEM_LIMIT);

    if (nextPageToken !== null && results.length >= PLAYLIST_ITEM_LIMIT) {
        LOGGER.warn('Length check failed for playlist %s: %d', id, results.length);
        // Should have been checked already by checkPlaylistMeta, but YouTube's
        // metadata cannot always be trusted.
        throw new Error(`YouTube Playlist is too long to queue (limit ${PLAYLIST_ITEM_LIMIT}).`);
    }

    return results;
}

async function checkPlaylistMeta(id) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails',
        id: id
    });

    const res = await ytRequest(url);
    if (res.pageInfo.totalResults === 0) {
        throw new Error('Invalid YouTube Playlist ID or unsupported playlist type');
    }

    const playlist = res.items[0];
    if (playlist.contentDetails.itemCount > PLAYLIST_ITEM_LIMIT) {
        LOGGER.warn('Rejecting YouTube Playlist %s for length %d', id, playlist.contentDetails.itemCount);
        throw new Error(`YouTube Playlist is too long to queue (limit ${PLAYLIST_ITEM_LIMIT}).`);
    }
}

/*
 * Attempts to parse a YouTube URL following one of the following forms:
 *   - youtu.be/(video id)
 *   - [www.]youtube.com/watch?v=(video id)
 *   - [www.]youtube.com/playllist?list=(playlist id)
 *
 * Returns {
 *           id: video or playlist id
 *           kind: 'single' or 'playlist'
 *           type: 'youtube'
 *         }
 * or null if the URL is invalid.
 */
export function parseUrl(url) {
    let m = url.match(/^yt:(.*)/);
    if (m) {
        return {
            type: 'youtube',
            kind: 'single',
            id: m[1]
        };
    }

    m = url.match(/^yp:(.*)/);
    if (m) {
        return {
            type: 'youtube',
            kind: 'playlist',
            id: m[1]
        };
    }

    const link = new URL(url);

    if (link.hostname === 'youtu.be') {
        return {
            type: 'youtube',
            kind: 'single',
            id: link.pathname.replace(/^\//, '')
        };
    } else if (!['www.youtube.com', 'youtube.com'].includes(link.hostname)) {
        return null;
    }

    if (link.pathname === '/watch') {
        return {
            type: 'youtube',
            kind: 'single',
            id: link.searchParams.get('v')
        };
    } else if (link.pathname === '/playlist') {
        return {
            type: 'youtube',
            kind: 'playlist',
            id: link.searchParams.get('list')
        };
    } else {
        return null;
    }
}

export function setApiKey(key) {
    API_KEY = key;
}

export function setCache(cache) {
    CACHE = cache;
}
