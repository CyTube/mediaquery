import urlparse from 'url';
import Promise from 'bluebird';

import { getJSON } from '../request';
import Media from '../media';

const QUALITIES = [240, 360, 480, 540, 720, 1080, 1440, 2160];

function getQuality(width, height) {
    let x;
    if (width > height) {
        x = height;
    } else {
        // Portrait video (why.jpg)
        x = width;
    }

    // Streamable doesn't rescale videos, so we kinda have to just guess at the
    // right quality label for this size
    for (let q of QUALITIES) {
        if (x <= q) {
            return q;
        }
    }

    return QUALITIES[QUALITIES.length - 1];
};


export function lookup(id) {
    return getJSON(`https://api.streamable.com/videos/${id}`).then(result => {
        switch (result.status) {
            case 0: throw new Error('Video is not done uploading yet');
            case 1: throw new Error('Video is not done processing yet');
            case 3: throw new Error('Video is unavailable');
        }

        let duration = 0;
        const streams = {};
        for (let key in result.files) {
            const file = result.files[key];
            let contentType;
            if (/mp4/.test(key)) {
                contentType = 'video/mp4';
            } else if (/webm/.test(key)) {
                contentType = 'video/webm';
            } else {
                continue;
            }

            if (file.status === 2) {
                const quality = getQuality(file.width, file.height);
                if (!streams.hasOwnProperty(quality)) {
                    streams[quality] = [];
                }
                streams[quality].push({
                    link: `https:${file.url}`,
                    contentType
                });
                duration = Math.max(Math.ceil(file.duration), duration);
            }
        }

        if (isNaN(duration)) {
            throw new Error('Streamable API did not return any video duration');
        }

        return new Media({
            id,
            title: result.title,
            duration,
            type: 'streamable',
            meta: {
                direct: streams,
                thumbnail: `https:${result.thumbnail_url}`
            }
        });
    });
}

export function parseUrl(url) {
    let m = url.match(/^sb:([\w-]+)$/);
    if (m) {
        return {
            type: 'streamable',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (!['streamable.com'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/^\/(?:e\/)?([\w-]+)/);
    if (m) {
        return {
            type: 'streamable',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}
