import urlparse from 'url';
import Promise from 'bluebird';

import { request, getJSON } from '../request';
import Media from '../media';

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0';
const LOGGER = require('@calzoneman/jsli')('mediaquery/vimeo');

/*
 * Retrieves video data from Vimeo anonymously.
 *
 * Returns a Media object
 */
export function lookupAnonymous(id) {
    return getJSON(`https://vimeo.com/api/v2/video/${id}.json`).then(result => {
        const video = result[0];
        return new Media({
            id,
            title: video.title,
            duration: video.duration,
            type: 'vimeo',
            meta: {
                thumbnail: video.thumbnail_medium
            }
        });
    });
}

export { lookupAnonymous as lookup };

function extractFromH264Object(fileMap) {
    const videos = {
        720: [],
        360: [],
        240: []
    };

    if ('mobile' in fileMap) {
        videos[240].push({
            link: fileMap.mobile.url,
            contentType: 'video/mp4'
        });
    }

    if ('sd' in fileMap) {
        videos[360].push({
            link: fileMap.sd.url,
            contentType: 'video/mp4'
        });
    }

    if ('hd' in fileMap) {
        videos[720].push({
            link: fileMap.hd.url,
            contentType: 'video/mp4'
        });
    }

    return videos;
};

function extractFromProgressiveList(fileList) {
    const videos = {};

    for (let file of fileList) {
        const source = {
            link: file.url,
            contentType: file.mime
        };

        let quality;
        switch (file.quality) {
            case '2160p': quality = 2160; break;
            case '1440p': quality = 1440; break;
            case '1080p': quality = 1080; break;
            case '720p': quality = 720; break;
            case '540p': quality = 540; break;
            case '480p': quality = 480; break;
            case '360p': quality = 360; break;
            case '270p': quality = 240; break;
            default:
                LOGGER.warn("Unrecognized quality %s", file.quality);
                continue;
        }

        if (!videos.hasOwnProperty(quality)) {
            videos[quality] = [];
        }
        videos[quality].push(source);
    }

    return videos;
};

export function extract(id) {
    const url = `https://player.vimeo.com/video/${id}`;
    return request(url, {
        headers: {
            'User-Agent': USER_AGENT
        }
    }).then(res => {
        if (res.statusCode !== 200) {
            return {};
        }

        const start = res.data.indexOf('{"cdn_url"');
        if (start < 0) {
            return {};
        }

        const end = res.data.indexOf('};', start);
        let data = res.data.substring(start, end+1);

        try {
            data = JSON.parse(data);
            const files = data.request.files.progressive;
            if (data.request.files.progressive) {
                return extractFromProgressiveList(data.request.files.progressive);
            } else if (data.request.files.h264) {
                return extractFromH264Object(data.request.files.h264);
            } else {
                LOGGER.error("Missing files for vi:%s", id);
                return {};
            }
        } catch (e) {
            if (res.data.indexOf('This video does not exist.') >= 0) {
                return {};
            } else if (res.data.indexOf(`Because of its privacy settings, this video cannot \
be played here`) >= 0) {
                return {};
            }
            LOGGER.error("Extract failed for vi:%s : %s", id, e.stack);
            return {};
        }
    });
}

export function lookupAndExtract(id) {
    return Promise.all([
        lookup(id),
        extract(id)
    ]).then(([video, files]) => {
        video.meta.direct = files;
        return video;
    });
}

/*
 * Attempts to parse a Vimeo URL of the form vimeo.com/(video id)
 *
 * Returns {
 *           id: video id
 *           kind: 'single'
 *           type: 'vimeo'
 *         }
 * or null if the URL is invalid.
 */
export function parseUrl(url) {
    const m = url.match(/^vi:(\d+)/);
    if (m) {
        return {
            type: 'vimeo',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url);

    if (data.hostname !== 'vimeo.com') {
        return null;
    }

    if (!data.pathname.match(/^\/\d+$/)) {
        return null;
    }

    return {
        type: 'vimeo',
        kind: 'single',
        id: data.pathname.replace(/^\//, '')
    };
}
