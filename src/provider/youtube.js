import Promise from 'bluebird';
import querystring from 'querystring';
import urlparse from 'url';

import { getJSON, request } from '../request';
import Media from '../media';

import { Counter } from 'prom-client';

const LOGGER = require('@calzoneman/jsli')('mediaquery/youtube');

let API_KEY = null;
let CACHE = null;

// https://en.wikipedia.org/wiki/ISO_8601#Durations
const DURATION_SCALE = [
    [/(\d+)D/, 24*3600],
    [/(\d+)H/, 3600],
    [/(\d+)M/, 60],
    [/(\d+)S/, 1]
];

/*
 * Parse an ISO 8601 time duration (the format used by YouTube).
 * In the interest of sanity, only days, hours, minutes, and seconds are
 * considered.
 */
function parseDuration(duration) {
    let time = 0;
    for (let [regex, scale] of DURATION_SCALE) {
        let m;
        if (m = duration.match(regex)) {
            time += parseInt(m[1]) * scale;
        }
    }

    return time;
};

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

function _lookupInternal(id, cached) {
    if (!API_KEY) {
        return Promise.reject(new Error('API key not set for YouTube v3 API'));
    }

    const params = querystring.stringify({
        key: API_KEY,
        part: 'contentDetails,status,snippet',
        id
    });

    const url = `https://www.googleapis.com/youtube/v3/videos?${params}`;
    let headers = {};
    if (cached !== null && cached.meta.etag) {
        headers = {
            'If-None-Match': cached.meta.etag
        };
    }

    return request(url, { headers }).then(res => {
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

        let result;
        try {
            result = JSON.parse(res.data);
        } catch (error) {
            LOGGER.error(
                'YouTube API returned non-JSON response: %s',
                String(res.data).substring(0, 1000)
            );
            throw new Error('Error calling YouTube API: could not decode response as JSON');
        }

        // Sadly, as of the v3 API, YouTube doesn't tell you *why* the request failed.
        if (result.items.length === 0) {
            throw new Error('Video does not exist or is private');
        }

        const video = result.items[0];

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
                if (video.snippet.liveBroadcastContent !== 'live') {
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
            id,
            type: 'youtube',
            title: video.snippet.title,
            duration: parseDuration(video.contentDetails.duration),
            meta: {
                thumbnail: video.snippet.thumbnails.default.url,
                etag: result.etag
            }
        };

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
    });
}

/*
 * Retrieve metadata for multiple YouTube videos.  As this is intended for use
 * by the search and playlist retrieval, it does not check for failed video IDs.
 * If a video is private, removed, or non-embeddable, its information simply
 * doesn't appear in the results.
 *
 * Returns a list of Media objects
 */
export function lookupMany(ids) {
    if (!API_KEY) {
        return Promise.reject(new Error('API key not set for YouTube v3 API'));
    }

    const params = querystring.stringify({
        key: API_KEY,
        part: 'contentDetails,status,snippet',
        id: ids.join(',')
    });

    const url = `https://www.googleapis.com/youtube/v3/videos?${params}`;

    return getJSON(url).then(result => {
        return result.items.filter(video => {
            if (!video.status || !video.contentDetails || !video.snippet) {
                LOGGER.info('Incomplete video; assuming deleted video with id=%s', video.id);
                return false;
            }

            return video.status.embeddable
        }).map(video => {
            const data = {
                id: video.id,
                type: 'youtube',
                title: video.snippet.title,
                duration: parseDuration(video.contentDetails.duration),
                meta: {
                    thumbnail: video.snippet.thumbnails.default.url
                }
            };

            if (video.contentDetails.regionRestriction) {
                const restriction = video.contentDetails.regionRestriction;
                if (restriction.blocked) {
                    data.meta.blocked = restriction.blocked;
                }
                if (restriction.allowed) {
                    data.meta.allowed = restriction.allowed;
                }
            }

            return new Media(data);
        });
    });
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

    query = query.replace(/%20/g, '+');

    let params = {
        key: API_KEY,
        part: 'id',
        maxResults: 25,
        q: query,
        type: 'video'
    };

    if (nextPage) {
        params.pageToken = nextPage;
    }

    params = querystring.stringify(params);

    const url = `https://www.googleapis.com/youtube/v3/search?${params}`;

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
export function lookupPlaylist(id, nextPage = false) {
    if (!API_KEY) {
        return Promise.reject(new Error('API key not set for YouTube v3 API'));
    }

    let params = {
        key: API_KEY,
        part: 'contentDetails',
        maxResults: 50,
        playlistId: id
    };

    if (nextPage) {
        params.pageToken = nextPage;
    }

    params = querystring.stringify(params);

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params}`;

    return getJSON(url).then(result => {
        return lookupMany(result.items.map(item => item.contentDetails.videoId))
                .then(videos => {
            if (result.nextPageToken) {
                // Retrieve the rest of the results, then concatenate them with the current
                // page
                return lookupPlaylist(id, result.nextPageToken).then(
                        other => videos.concat(other));
            } else {
                // No more pages of results
                return videos;
            }
        });
    });
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

    const data = urlparse.parse(url, true);

    if (data.hostname === 'youtu.be') {
        return {
            type: 'youtube',
            kind: 'single',
            id: data.pathname.replace(/^\//, '')
        };
    } else if (!['www.youtube.com', 'youtube.com'].includes(data.hostname)) {
        return null;
    }

    if (data.pathname === '/watch') {
        return {
            type: 'youtube',
            kind: 'single',
            id: data.query.v
        };
    } else if (data.pathname === '/playlist') {
        return {
            type: 'youtube',
            kind: 'playlist',
            id: data.query.list
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
