import querystring from 'querystring';
import urlparse from 'url';

import { getJSON } from '../request';
import Media from '../media';

const DM_FIELDS = [
    'title',
    'duration',
    'thumbnail_120_url',
    'allow_embed',
    'status'
].join(',');

/*
 * Retrieves video data for a Dailymotion video
 *
 * Returns a Media object
 */
function lookup(id) {
    id = id.split('_')[0];

    const params = `?fields=${DM_FIELDS}`;
    const url = `https://api.dailymotion.com/video/${id}${params}`;

    return getJSON(url).then(result => {
        if (!result.allow_embed) {
            return Promise.reject(
                    new Error(`The uploader has made this video non-embeddable`));
        }

        if (result.status !== 'published') {
            return Promise.reject(new Error('Video status is not published'));
        }

        const data = {
            id,
            type: 'dailymotion',
            title: result.title,
            duration: result.duration,
            meta: {
                thumbnail: result.thumbnail_120_url
            }
        };

        return new Media(data);
    });
}

/*
 * Attempts to parse a Dailymotion URL of the form dailymotion.com/video/(video id)
 *
 * Returns {
 *           id: video id
 *           kind: 'single'
 *           type: 'dailymotion'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^dm:([a-zA-Z0-9]+)/);
    if (m) {
        return {
            type: 'dailymotion',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url);

    if (!['www.dailymotion.com', 'dailymotion.com'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/^\/video\/([a-zA-Z0-9]+)/);
    if (!m) {
        return null;
    }

    return {
        id: m[1],
        kind: 'single',
        type: 'dailymotion'
    };
}
