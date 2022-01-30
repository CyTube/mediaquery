import Media from '../media';
import { findAll } from 'domutils';
import { request } from '../request';
import { parseDom } from '../util/xmldom';
import { ytdl, getDuration }  from '../scraper';

const LOGGER = require('@calzoneman/jsli')('mediaquery/bitchute');

let CACHE = null;
const MAX_AGE = 60 * 60 * 8;

const source = process.env.MQ_BITCHUTE || 'native';

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
            LOGGER.error('Error retrieving cached metadata for bc:%s - %s', id, error.stack);
        }
    }

    switch(source.toLowerCase()) {
        case 'native':
            return _lookupNative(id);
        case 'external':
            return _lookupExternal(id);
        default:
            throw new Error('Invalid Bitchute lookup source.');
    }
}

async function _lookupNative(id) {
    const url = `https://www.bitchute.com/video/${id}/`;

    try {
        const res = await request(url);
        if (res.statusCode !== 200) {
            throw new Error(`Bitchute lookup failed for ${id}: ${res.statusMessage}`);
        }

        const info = {
            title: '',
            thumbnail: '',
            url: '',
        }
        findAll(elem => ['title','video','source'].includes(elem.name), parseDom(res.data))
            .forEach(elem => {
                switch(elem.name){
                    case 'title':
                        info.title = (elem.children[0].data);
                        break;
                    case 'video':
                        info.thumbnail = elem.attribs.poster;
                        break;
                    case 'source':
                        info.url = elem.attribs.src;
                        break;
                }
            });

        const duration = await getDuration(info.url);

        const media = {
            id,
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
                LOGGER.error('Error updating cached metadata for bc:%s - %s', id, error.stack);
            }
        }
        return new Media(media);
    } catch (err) {
        throw err;
    }
}

async function _lookupExternal(id) {
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
                LOGGER.error('Error updating cached metadata for bc:%s - %s', id, error.stack);
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

    const link = new URL(url.replace('www.',''));

    if (link.hostname !== 'bitchute.com') {
        return null;
    }

    if (!link.pathname.startsWith('/video/')) {
        return null;
    }

    const id = link.pathname.slice(7).split('/').shift();
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
