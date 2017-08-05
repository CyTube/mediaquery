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
    }).then(media => {
        return getJSON(`https://clips.twitch.tv/api/v2/clips/${id}/status`).then(result => {
            const videos = {
                1080: [],
                720: [],
                480: [],
                360: []
            };

            result.quality_options.forEach(opt => {
                if (videos.hasOwnProperty(opt.quality)) {
                    videos[opt.quality].push({
                        link: opt.source,
                        contentType: 'video/mp4'
                    });
                }
            });

            media.meta.direct = videos;
            return media;
        });
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

    if (!['clips.twitch.tv'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/^\/([A-Za-z]+)$/);
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
