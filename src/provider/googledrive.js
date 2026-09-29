import { findAll } from 'domutils';
import { parseDom } from '../util/xmldom';
import { request } from '../request';
import Media from '../media';
import { ITAG_QMAP, ITAG_CMAP } from '../util/itag';

const LOGGER = require('@calzoneman/jsli')('mediaquery/googledrive');

// Official-ish internal API used by Google Drive player / yt-dlp (2025-2026)
const PLAYBACK_API = (id) =>
    `https://content-workspacevideo-pa.googleapis.com/v1/drive/media/${id}/playback?key=AIzaSyDVQw45DwoYh632gvsP5vPDqEKvb-Ywnb8`;

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://drive.google.com/',
    'Origin': 'https://drive.google.com'
};

function extractHexId(url) {
    if (!url) return null;
    const m = url.match(/vid=([\w-]+)/);
    return m ? m[1] : null;
}

function mapHeightToQuality(height) {
    if (height >= 1080) return 1080;
    if (height >= 720)  return 720;
    if (height >= 480)  return 480;
    return 360;
}

function parseDuration(durationStr) {
    if (!durationStr) return 0;
    // Format is usually like "45.069s" or ISO-8601
    const match = String(durationStr).match(/([\d.]+)/);
    if (match) {
        const secs = parseFloat(match[1]);
        if (!Number.isNaN(secs) && secs > 0) return Math.round(secs);
    }
    return 0;
}

async function fetchAndParse(id, options = {}) {
    const url = PLAYBACK_API(id);

    const res = await request(url, {
        ...options,
        headers: {
            ...DEFAULT_HEADERS,
            ...(options.headers || {})
        }
    });

    if (res.statusCode !== 200) {
        throw new Error(`Google Drive lookup failed for ${id}: HTTP ${res.statusCode} ${res.statusMessage}`);
    }

    let data;
    try {
        data = JSON.parse(res.data);
    } catch (e) {
        throw new Error(`Google Drive lookup failed for ${id}: invalid JSON response`);
    }

    // Build quality buckets (same structure the rest of the system expects)
    const videos = {
        1080: [],
        720: [],
        480: [],
        360: []
    };

    const progressive = data.mediaStreamingData?.formatStreamingData?.progressiveTranscodes || [];
    const adaptive    = data.mediaStreamingData?.formatStreamingData?.adaptiveTranscodes || [];
    const allStreams  = [...progressive, ...adaptive];

    for (const stream of allStreams) {
        const link = stream.url;
        if (!link) continue;

        const meta = stream.transcodeMetadata || {};
        const height = meta.height || 0;
        const quality = mapHeightToQuality(height);
        const itag = stream.itag || 0;
        const contentType = meta.mimeType || 'video/mp4';

        videos[quality].push({
            itag,
            contentType,
            link,
            width: meta.width || null,
            height: height || null
        });
    }

    // Fallback: if no progressive/adaptive streams were found
    if (Object.values(videos).every(arr => arr.length === 0)) {
        throw new Error(
            'Google has removed the video streams associated with this item. ' +
            'It can no longer be played.'
        );
    }

    const title = data.mediaMetadata?.title || null;
    const duration = parseDuration(data.mediaMetadata?.duration);
    const thumbnail = data.thumbnails?.[0]?.url || null;

    const mediaData = {
        id,
        type: 'googledrive',
        title,
        duration,
        meta: {
            thumbnail,
            direct: videos
        }
    };

    if (options.fetchSubtitles) {
        // Try to extract a video id suitable for the timedtext endpoint
        const timedTextBase = data.timedTextDetails?.timedTextBaseUrl;
        const vid = extractHexId(timedTextBase) || id;

        try {
            const subtitles = await getSubtitles(id, vid);
            if (subtitles) {
                mediaData.meta.gdrive_subtitles = subtitles;
            }
        } catch (err) {
            LOGGER.error('Failed to retrieve subtitles for %s: %s', id, err.stack || err);
        }
    }

    return new Media(mediaData);
}

export function lookup(id) {
    // return fetchAndParse(id, { fetchSubtitles: true });
    return fetchAndParse(id, { fetchSubtitles: false });
}

export function getSubtitles(id, vid) {
    const url = new URL('https://drive.google.com/timedtext');
    url.search = new URLSearchParams({
        id,
        v: id,
        vid: vid || id,
        type: 'list',
        hl: 'en-US'
    });

    return request(url.toString()).then(res => {
        if (res.statusCode !== 200) {
            throw new Error(
                `Google Drive subtitle lookup failed for ${id}: ` +
                `${res.statusMessage} (url: ${url})`
            );
        }

        const subtitles = {
            vid: vid || id,
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
        LOGGER.error('Failed to retrieve subtitles: %s', err.stack || err);
        return null;
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

    let link;
    try {
        link = new URL(url);
    } catch (e) {
        return null;
    }

    if (!['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'].includes(link.hostname)) {
        return null;
    }

    m = link.pathname.match(/file\/d\/([\w-]+)/);
    if (!m) {
        if (link.pathname === '/open' || link.pathname === '/uc' || link.pathname === '/download') {
            m = link.search.match(/[?&]id=([\w-]+)/);
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
