import { getJSON } from '../request';
import Media from '../media';

const short = require('short-uuid');
const translator = short();

let DOMAINS = [];

export function setDomains(domains) {
    DOMAINS = domains;
}

export async function fetchPeertubeDomains() {
    // May need to account for paginated results in the future
    const url = 'https://instances.joinpeertube.org/api/v1/instances' +
        '?start=0&count=1000&sort=-totalLocalVideos';

    let res = await getJSON(url);
    return res.data.map(peer => peer.host);
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
export async function lookup(id) {
    const [domain, UUID] = id.split(';');
    if (!DOMAINS.includes(domain)) {
        throw new Error(
            `Unrecognized peertube host ${domain}; ask an administrator to regenerate the peertube domain list`
        );
    }
    if (UUID === undefined) {
        throw new Error(`Invalid peertube ID ${id}`);
    }

    const shortUUID = [32,36].includes(UUID.length) ? convertToShort(UUID) : UUID;
    const url = `https://${domain}/api/v1/videos/${translator.toUUID(shortUUID)}`;

    try {
        const result = await getJSON(url);
        console.log(require('util').inspect(result, { depth: 10 }));
        if (result.privacy.id !== 1 && result.privacy.id !== 2) {
            throw new Error('The uploader has made this video unavailable');
        }
        if (result.state.label !== 'Published') {
            throw new Error('Video status is not published');
        }

        let thumbnail = result.previewPath;
        if (/^\//.test(thumbnail)) {
            // Convert relative path to absolute
            thumbnail = `https://${domain}${thumbnail}`;
        }

        const hostname = result?.channel?.host || domain;
        const data = {
            id: `${hostname};${shortUUID}`,
            type: 'peertube',
            title: result.name,
            duration: result.duration,
            meta: {
                thumbnail,
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
    } catch(e) {
        throw e;
    }
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

    const link = new URL(url);
    const regLong = [8, 4, 4, 4, 12].map(x => `[0-9a-f]{${x}}`).join('-');
    const regShort = '[a-zA-Z0-9]{22}';
    const pattern = new RegExp(`(?:/w/|/videos/watch/)(?:(?<short>${regShort})|(?<long>${regLong}))`);

    m = link.pathname.match(pattern);
    if (!m) {
        return null;
    }

    if (!domains.includes(link.hostname)) {
        return null;
    }

    const shortUUID = m.groups.short ? m.groups.short : translator.fromUUID(m.groups.long);

    return {
        id: `${link.hostname};${shortUUID}`,
        kind: 'single',
        type: 'peertube'
    };
}
