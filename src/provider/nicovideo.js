import Media from '../media';
import { ytdl }  from '../scraper';

/*
 * Retrieves video data for a Nico Nico Douga video
 *
 * Returns a Media object
 *
 */
export async function lookup(id) {
    const url = `https://www.nicovideo.jp/watch/${id}`;

    const result = await ytdl(url);
    const info = result._api_data.video;

    switch(true){
        case info.isDeleted:
            throw new Error('This video has been deleted');
        case info.isPrivate:
            throw new Error('This video has been made private');
        case !info.isEmbedPlayerAllowed:
            throw new Error('This video is restricted from embedding');
        // case info.isAuthenticationRequired:
            // does embedding work if users have a nico account and are logged in?
    }

    const media = {
        id: info.id,
        type: 'nicovideo',
        title: info.title,
        duration: info.duration,
        meta: {
            thumbnail: result.thumbnail
        }
    };

    return new Media(media);
}


/*
 * Attempts to parse a NicoVideo URL of the forms:
 *   nv:%id%
 *   nicovideo.jp/watch/%id%
 *
 * Returns {
 *           id:   %id%
 *           kind: 'single'
 *           type: 'nicovideo'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^nv:(sm\d{7,8})$/);
    if (m) {
        return {
            type: 'nicovideo',
            kind: 'single',
            id: m[1]
        };
    }

    const link = new URL(url.replace('www.',''));

    if (link.hostname !== 'nicovideo.jp') {
        return null;
    }

    if (!link.pathname.startsWith('/watch/')) {
        return null;
    }

    const id = link.pathname.slice(7).split('/').shift();
    if(!id.match(/^sm\d{7,8}$/)){
        return null
    }
    return {
        type: 'nicovideo',
        kind: 'single',
        id: id
    };
}
