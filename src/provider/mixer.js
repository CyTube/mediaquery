import urlparse from 'url';

import { getJSON } from '../request';
import Media from '../media';

let CLIENT_ID = null;

export function lookup(id) {
    if (!CLIENT_ID) {
        return Promise.reject(new Error('Client ID not set for Mixer API'));
    }

    return getJSON(`https://mixer.com/api/v1/channels/${id}`, {
        headers: {
            'Client-ID': CLIENT_ID
        }
    }).then(result => {
        const titlePrefix = `${result.token} on Mixer - `;
        const media = new Media({
            id: String(result.id),
            title: `${titlePrefix}${result.name.substring(0, 100-titlePrefix.length)}`,
            duration: 0,
            type: 'mixer',
            meta: {
                mixer: {
                    channelId: result.id,
                    channelToken: result.token
                },
                thumbnail: result.thumbnail.url
            }
        });

        return media;
    });
}

export function parseUrl(url) {
    let m = url.match(/^mx:([\w-]+)$/);
    if (m) {
        return {
            type: 'mixer',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (data.hostname !== 'mixer.com') {
        return null;
    }

    m = data.pathname.match(/^\/([\w-]+)$/);
    if (m) {
        return {
            type: 'mixer',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}

export function setClientID(clientID) {
    return CLIENT_ID = clientID;
}
