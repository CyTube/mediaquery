import urlparse from 'url';
import Media from '../media';
import { ytdl } from '../scraper';

/*
 * Retrieves track data for a Bandcamp song
 *
 * Returns a Media object
 *
 */
export function lookup(id) {
    var [artist, track] = id.split(';');
    const trackURL = `https://${artist}.bandcamp.com/track/${track}`;

    return ytdl(trackURL).then((info)=>{

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
    }).catch((err)=>{
        throw err;
    });
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

