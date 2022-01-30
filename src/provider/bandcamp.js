import Media from '../media';
import { ytdl } from '../scraper';
import { request } from '../request';
import { findAll } from 'domutils';
import { parseDom } from '../util/xmldom';

const source = process.env.MQ_BANDCAMP || 'native';

/*
 * Retrieves track data for a Bandcamp song
 *
 * Returns a Media object
 *
 */
export async function lookup(id) {
    switch(source.toLowerCase()) {
        case 'native':
            return _lookupNative(id);
        case 'external':
            return _lookupExternal(id);
        default:
            throw new Error('Invalid Bandcamp lookup source.');
    }
}

async function _lookupNative(id) {
    const [artist, track] = id.split(';');
    const trackURL = `https://${artist}.bandcamp.com/track/${track}`;

    try {
        const res = await request(trackURL);
        if (res.statusCode !== 200) {
            throw new Error(`Bandcamp lookup failed for ${id}: ${res.statusMessage}`);
        }
        const info = {
            title: '',
            duration: '',
            thumbnail: '',
            url: '',
        }
        findAll(elem => elem.name === 'script', parseDom(res.data))
            .filter(elem => {
                return elem.attribs.type ==='application/ld+json' || elem.attribs['data-tralbum'];
            })
            .forEach(elem => {
                if(elem.attribs.type ==='application/ld+json'){
                    // Get text content and parse it
                    const data = JSON.parse(elem.children[0].data);
                    info.thumbnail = data.image;
                } else {
                    const data = JSON.parse(elem.attribs['data-tralbum']);
                    const trackinfo = data.trackinfo.pop();
                    info.title = `${data.artist} - ${trackinfo.title}`;
                    info.duration = trackinfo.duration;
                    info.url = trackinfo.file['mp3-128'];
                }
            });

        const media = {
            id: `${artist};${track}`,
            type: 'bandcamp',
            title: info.title,
            duration: Math.floor(info.duration),
            meta: {
                direct: {
                    '480': [{
                        contentType: 'audio/mp3',
                        link: info.url,
                        quality: '480'
                    }]
                },
                thumbnail: info.thumbnail,
            }
        };

        return new Media(media);
    } catch (e) {
        throw e;
    }
}

async function _lookupExternal(id) {
    const [artist, track] = id.split(';');
    const trackURL = `https://${artist}.bandcamp.com/track/${track}`;

    try {
        const info = await ytdl(trackURL);
        const data = {
            id: `${artist};${track}`,
            type: 'bandcamp',
            title: info.title,
            duration: Math.floor(info.duration),
            meta: {
                direct: {
                    '480': [{
                        contentType: 'audio/mp3',
                        link: info.url,
                        quality: '480'
                    }]
                },
                thumbnail: info.thumbnail,
            }
        };

        return new Media(data);
    } catch (e) {
        throw e;
    }
}

/*
 * Attempts to parse a Bandcamp URL of the forms:
 *   bc:(artist);(track)
 *   https://(artist).bandcamp.com/track/(track)
 *
 * Returns {
 *           id: artist;track
 *           kind: 'single'
 *           type: 'bandcamp'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^bc:([^.]+;[^/?#&]+)/);
    if (m) {
        return {
            type: 'bandcamp',
            kind: 'single',
            id: m[1]
        };
    }

    const format = new RegExp('https?://(?<artist>[^.]+)\.bandcamp\.com/track/(?<track>[^/?#&]+)');
    m = url.match(format);
    if (!m) {
        return null;
    }

    return {
        id: `${m.groups.artist};${m.groups.track}`,
        kind: 'single',
        type: 'bandcamp'
    };
}
