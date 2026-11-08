import { findAll } from 'domutils';
import { parseDom } from '../util/xmldom';
import { request } from '../request';
import Media from '../media';
import { ITAG_QMAP, ITAG_CMAP } from '../util/itag';

const LOGGER = require('@calzoneman/jsli')('mediaquery/googledrive');

// Public web-client key used by Google Drive's own video player / yt-dlp.
const PLAYBACK_API_KEY = 'AIzaSyDVQw45DwoYh632gvsP5vPDqEKvb-Ywnb8';
const PLAYBACK_API =
    'https://content-workspacevideo-pa.googleapis.com/v1/drive/media';

const extractHexId = function(url) {
    const m = url.match(/vid=([\w-]+)/);
    if (m) {
        return m[1];
    } else {
        return null;
    }
};

function parseDurationSeconds(duration) {
    if (typeof duration === 'number' && Number.isFinite(duration)) {
        return Math.floor(duration);
    }
    if (typeof duration !== 'string') {
        return 0;
    }
    const seconds = parseFloat(duration);
    return Number.isFinite(seconds) ? Math.floor(seconds) : 0;
}

function mapProgressiveStreams(progressiveTranscodes) {
    const videos = {
        1080: [],
        720: [],
        480: [],
        360: []
    };

    for (const fmt of progressiveTranscodes || []) {
        const itag = parseInt(fmt.itag, 10);
        if (!ITAG_QMAP.hasOwnProperty(itag) || !fmt.url) {
            continue;
        }

        const meta = fmt.transcodeMetadata || {};
        videos[ITAG_QMAP[itag]].push({
            itag,
            contentType: meta.mimeType || ITAG_CMAP[itag],
            link: fmt.url
        });
    }

    return videos;
}

function hasAnyStream(videos) {
    return Object.keys(videos).some(q => videos[q].length > 0);
}

function localizeApiError(body) {
    try {
        const err = typeof body === 'string' ? JSON.parse(body) : body;
        const details = err && err.error && err.error.details;
        if (Array.isArray(details)) {
            const localized = details.find(
                d => d && d.message && /LocalizedMessage/.test(d['@type'] || '')
            );
            if (localized && localized.message) {
                return localized.message;
            }
        }
        if (err && err.error && err.error.message) {
            return err.error.message;
        }
    } catch (_e) {
        // fall through
    }
    return null;
}

function fetchAndParse(id, options = {}) {
    const url = `${PLAYBACK_API}/${encodeURIComponent(id)}/playback?key=${PLAYBACK_API_KEY}`;

    return request(url, {
        headers: {
            Referer: 'https://drive.google.com/'
        }
    }).then(function(res) {
        if (res.statusCode !== 200) {
            const localized = localizeApiError(res.data);
            if (res.statusCode === 404) {
                throw new Error(
                    localized ||
                    'Google Drive video not found, or it is not shared publicly'
                );
            }
            if (res.statusCode === 401 || res.statusCode === 403) {
                throw new Error(
                    localized ||
                    'Google Drive videos must be shared publicly'
                );
            }
            throw new Error(
                localized ||
                `Google Drive lookup failed for ${id}: HTTP ${res.statusCode}`
            );
        }

        let doc;
        try {
            doc = JSON.parse(res.data);
        } catch (e) {
            throw new Error('Google Drive playback response was not valid JSON');
        }

        if (doc.error) {
            throw new Error(
                localizeApiError(doc) ||
                'Google Drive flagged this video as unplayable'
            );
        }

        const formatData = doc.mediaStreamingData
            && doc.mediaStreamingData.formatStreamingData;
        const progressive = formatData && formatData.progressiveTranscodes;
        const videos = mapProgressiveStreams(progressive);

        if (!hasAnyStream(videos)) {
            throw new Error(
                'Google has removed the video streams associated with' +
                ' this item.  It can no longer be played.'
            );
        }

        const meta = doc.mediaMetadata || {};
        const thumbs = doc.thumbnails || [];
        const thumbnail = (thumbs[0] && thumbs[0].url) || undefined;
        const timedTextBaseUrl = doc.timedTextDetails
            && doc.timedTextDetails.timedTextBaseUrl;

        const data = {
            id,
            type: 'googledrive',
            title: meta.title || id,
            duration: parseDurationSeconds(meta.duration),
            meta: {
                thumbnail,
                direct: videos
            }
        };

        if (options.fetchSubtitles) {
            return getSubtitles(id, extractHexId(timedTextBaseUrl || '')).then(subtitles => {
                if (subtitles) {
                    data.meta.gdrive_subtitles = subtitles;
                }
                return new Media(data);
            });
        } else {
            return new Media(data);
        }
    });
};

export function lookup(id) {
    return fetchAndParse(id, { fetchSubtitles: true });
}

export function getSubtitles(id, vid) {
    if (!vid) {
        return Promise.resolve(null);
    }

    const url = new URL('https://drive.google.com/timedtext');
    url.search = new URLSearchParams({
        id,
        v: id,
        vid,
        type: 'list',
        hl: 'en-US'
    });

    return request(url).then(res => {
        if (res.statusCode !== 200) {
            throw new Error(`Google Drive subtitle lookup failed for ${id}: \
${res.statusMessage} (url: ${url})`);
        }

        const subtitles = {
            vid,
            available: []
        };

        findAll(elem => elem.name === 'track', parseDom(res.data))
                .forEach(elem => {
            subtitles.available.push({
                lang: elem.attribs.lang_code,
                lang_original: elem.attribs.lang_original,
                name: elem.attribs.name
            });
        });

        return subtitles;
    }).catch(err => {
        LOGGER.error("Failed to retrieve subtitles: %s", err.stack)
    });
}

export function parseUrl(url) {
    let m = url.match(/^gd:([\w-]+)$/);
    if (m) {
        return {
            type: 'googledrive',
            kind: 'single',
            id: m[1]
        };
    }

    const link = new URL(url);

    if (!['drive.google.com', 'docs.google.com'].includes(link.hostname)) {
        return null;
    }

    m = link.pathname.match(/file\/d\/([\w-]+)/);
    if (!m) {
        if (link.pathname === '/open') {
            m = link.search.match(/id=([\w-]+)/);
        }
    }

    if (m) {
        return {
            type: 'googledrive',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}
