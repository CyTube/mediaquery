import urlparse from 'url';
import { getJSON } from '../request';
import Media from '../media';

const short = require('short-uuid');
const translator = short();
let domains = [];

try {
    domains = require('../util/peers.json');
} catch (e) {
    console.error('Error: Unable to load PeerTube domain list.');
    console.error('You need to generate it with:');
    console.error('  npm run-script generate-peertubelist');
    process.exit(1);
}

function convertToShort(UUID){
    const shortUUID = translator.fromUUID(UUID);
    return shortUUID;
}


/*
 * Retrieves video data for a PeerTube video
 *
 * Returns a Media object
 *
 * Note: Older PeerTube instances don't support shortUUIDs, but they are more convenient
 *       We shall use them consistently internally and inform the client if it is an older instance
 *       The lack of the presence of shortUUID in the result indicates an older instance.
 *
 */
export function lookup(id) {
    var [domain, UUID] = id.split(';');
    const shortUUID = [32,36].includes(UUID.length) ? convertToShort(UUID) : UUID;

    const url = `https://${domain}/api/v1/videos/${translator.toUUID(shortUUID)}`;

    return getJSON(url).then(result => {
        if (result.privacy.id !== 1 && result.privacy.id !== 2) {
            return Promise.reject(
                    new Error(`The uploader has made this video unavailable`));
        }

        if (result.state.label !== 'Published') {
            return Promise.reject(new Error('Video status is not published'));
        }

        const hostname = result?.channel?.host || domain;
        const data = {
            id: `${hostname};${shortUUID}`,
            type: 'peertube',
            title: result.name,
            duration: result.duration,
            meta: {
                thumbnail: result.previewPath,
                embed: {
                    tag: 'iframe',
                    domain: hostname,
                    uuid: result.uuid,
                    short: shortUUID,
                    onlyLong: result.shortUUID ? false : true
                }
            }
        };

        return new Media(data);
    });
}


/*
 * Attempts to parse a PeerTube URL of the forms:
 *   pt:(domain);(shortUUID)
 *   (domain)/w/(shortUUID)
 *   (domain)/videos/watch/(longUUID)
 *
 * Returns {
 *           id: domain;shortuuid
 *           kind: 'single'
 *           type: 'peertube'
 *         }
 * or null if the URL is invalid
 */
export function parseUrl(url) {
    let m = url.match(/^pt:([a-zA-Z0-9-.]+;[a-zA-Z0-9]{22})/);
    if (m) {
        return {
            type: 'peertube',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url);
    const regLong = [8, 4, 4, 4, 12].map(x => `[0-9a-f]{${x}}`).join('-');
    const regShort = '[a-zA-Z0-9]{22}';
    const pattern = new RegExp(`(?:/w/|/videos/watch/)(?:(?<short>${regShort})|(?<long>${regLong}))`);

    m = data.pathname.match(pattern);
    if (!m) {
        return null;
    }

    if (!domains.includes(data.hostname)) {
        return null;
    }

    const shortUUID = m.groups.short ? m.groups.short : translator.fromUUID(m.groups.long);

    return {
        id: `${data.hostname};${shortUUID}`,
        kind: 'single',
        type: 'peertube'
    };
}
