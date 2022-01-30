import Media from '../media';
import { ytdl } from '../scraper';

/*
 * Retrieves media data for an Odysee video
 *
 * Returns a Media object
 *
 */
export function lookup(id) {
    var [user, video] = id.split(';');
    const mediaURL = `https://odysee.com/@${user}/${video}`;

    return ytdl(mediaURL).then((info)=>{
        const data = {
            id: `${user};${video}`,
            type: 'odysee',
            title: info.title,
            duration: Math.floor(info.duration),
            meta: {
                embed: {
                    tag: 'iframe',
                    src: `https://odysee.com/$/embed/${video}/${info.id}`
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
 * Attempts to parse an Odysee URL of the forms:
 *   od:(user);(video)
 *   https://odysee.com/@(user)/(video)
 *
 * Returns {
 *           id: user;video
 *           kind: 'single'
 *           type: 'odysee'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^od:([^:]+;[^/?#&:]+)/);
    if (m) {
        return {
            type: 'odysee',
            kind: 'single',
            id: m[1]
        };
    }

    const format = new RegExp('https?://odysee.com/@(?<user>[^:]+)(?::\\w)?/(?<video>[^:]+)');
    m = url.match(format);
    if (!m) {
        return null;
    }

    return {
        id: `${m.groups.user};${m.groups.video}`,
        kind: 'single',
        type: 'odysee'
    };
}
