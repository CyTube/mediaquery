import urlparse from 'url';
import Media from '../media';
import { ytdl, getDuration }  from '../scraper';

/*
 * Retrieves video data for a BitChute video
 *
 * Returns a Media object
 *
 */
export function lookup(id) {
    const url = `https://www.bitchute.com/video/${id}/`;

    return ytdl(url).then((info)=>{
        return getDuration(info.url).then((duration)=>{
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
    }).catch((err)=>{
        throw err;
    });
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
