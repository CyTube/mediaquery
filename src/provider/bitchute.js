const util = require('util');
const exec = util.promisify(require('child_process').exec);

import urlparse from 'url';
import Media from '../media';

/*
 * Retrieves video data for a BitChute video
 *
 * Returns a Media object
 *
 */
export function lookup(id) {
    const ffpar = '-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1'
    const url = `https://www.bitchute.com/video/${id}/`;

    return exec(`yt-dlp -j ${url}`).then((result)=>{
        const info = JSON.parse(result.stdout);

        return exec(`ffprobe ${ffpar} ${info.url}`).then((result)=>{
            const duration = Math.floor(result.stdout);

            const data = {
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

            return new Media(data);
        });
    });
}

/*
 * Attempts to parse a BitChute URL of the forms:
 *   bc:id
 *   bitchute.com/video/${id}
 *
 * Returns {
 *           id:   id
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

    return {
        type: 'bitchute',
        kind: 'single',
        id: data.pathname.slice(7).split('/').shift()
    };
}
