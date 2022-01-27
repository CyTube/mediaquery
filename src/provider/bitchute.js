import urlparse from 'url';
import Media from '../media';
import { ytdl, getDuration }  from '../scraper';

const LOGGER = require('@calzoneman/jsli')('mediaquery/bitchute');

let CACHE = null;
const MAX_AGE = 60 * 60 * 8;

/*
 * Retrieves video data for a BitChute video
 *
 * Returns a Media object
 *
 */
export async function lookup(id) {
    let cached = null;
    if (CACHE !== null) {
        try {
            cached = await CACHE.get(id, 'bc');
            if (cached !== null && cached.meta.cacheAge < MAX_AGE) {
                return cached;
            }
        } catch (error) {
            LOGGER.error('Error retrieving cached metadata for yt:%s - %s', id, error.stack);
        }
    }

    const url = `https://www.bitchute.com/video/${id}/`;
    try {
        const info = await ytdl(url);
        const duration = await getDuration(info.url);

        const media = {
            id: info.id,
            type: 'bitchute',
            title: info.title,
            duration: duration,
            meta: {
                direct: {
                    480: [{
                        contentType: 'video/mp4',
                        link: info.url
                    }]
                },
                thumbnail: info.thumbnail,
            }
        };

        if (CACHE !== null) {
            try {
                await CACHE.put(new Media(media));
            } catch (error) {
                LOGGER.error('Error updating cached metadata for yt:%s - %s', id, error.stack);
            }
        }
        return new Media(media);
    } catch(err) {
        throw err;
    }
}

/*
 * Attempts to parse a BitChute URL of the forms:
 *   bc:%id%
 *   bitchute.com/video/%id%
 *
 * Returns {
 *           id:   %id%
 *           kind: 'single'
 *           type: 'bitchute'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^bc:([-_0-9a-zA-Z]{11,12})$/);
    if (m) {
        return {
            type: 'bitchute',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url.replace('www.',''));

    if (data.hostname !== 'bitchute.com') {
        return null;
    }

    if (!data.pathname.startsWith('/video/')) {
        return null;
    }

    const id = data.pathname.slice(7).split('/').shift();
    if(!id.match(/^[-_0-9a-zA-Z]{11,12}$/)){
        return null
    }
    return {
        type: 'bitchute',
        kind: 'single',
        id: id
    };
}

export function setCache(cache) {
    CACHE = cache;
}
