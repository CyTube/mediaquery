import urlparse from 'url';

import { getJSON } from '../request';
import Media from '../media';

let CLIENT_ID = null;

export function lookup(id) {
    if (!CLIENT_ID) {
        return Promise.reject(new Error('Client ID not set for Twitch API'));
    }

    return getJSON(`https://api.twitch.tv/kraken/videos/${id}`, {
        headers: {
            'Client-ID': CLIENT_ID
        }
    }).then(result => {
        const media = new Media({
            id,
            title: result.title,
            duration: result.length,
            type: 'twitchvod',
            meta: {}
        });

        if (result.thumbnails.length > 0) {
            media.meta.thumbnail = result.thumbnails[0].url;
        }

        return media;
    });
}

export function parseUrl(url) {
    let m = url.match(/^tv:([cv]\d+)$/);
    if (m) {
        return {
            type: 'twitchvod',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (!['www.twitch.tv', 'twitch.tv'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/^\/(?:.*?)\/([cv])\/(\d+)/);
    if (m) {
        return {
            type: 'twitchvod',
            kind: 'single',
            id: m[1] + m[2]
        };
    }

    return null;
}

export function setClientID(clientID) {
    return CLIENT_ID = clientID;
}
