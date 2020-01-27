import urlparse from 'url';

import { getJSON } from '../request';
import Media from '../media';

let CLIENT_ID = null;

export function lookup(id) {
    if (!CLIENT_ID) {
        return Promise.reject(new Error('Client ID not set for Twitch API'));
    }

    return getJSON(`https://api.twitch.tv/kraken/clips/${id}`, {
        headers: {
            'Client-ID': CLIENT_ID,
            'Accept': 'application/vnd.twitchtv.v5+json'
        }
    }).then(result => {
        const media = new Media({
            id,
            title: result.title,
            duration: result.duration,
            type: 'twitchclip',
            meta: {}
        });

        if (result.thumbnails) {
            media.meta.thumbnail = result.thumbnails.medium;
        }

        return media;
    });
}

export function parseUrl(url) {
    let m = url.match(/^tc:([A-Za-z]+)$/);
    if (m) {
        return {
            type: 'twitchclip',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (!['clips.twitch.tv', 'www.twitch.tv'].includes(data.hostname)) {
        return null;
    }

    if (data.hostname === 'www.twitch.tv') {
        m = data.pathname.match(/^\/.*\/clip\/([A-Za-z]+)/)
    } else {
        m = data.pathname.match(/^\/([A-Za-z]+)$/);
    }

    if (m) {
        return {
            type: 'twitchclip',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}

export function setClientID(clientID) {
    return CLIENT_ID = clientID;
}
