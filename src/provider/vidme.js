import urlparse from 'url';
import Promise from 'bluebird';

import { getJSON } from '../request';
import Media from '../media';

export function lookup(id) {
    return getJSON(`https://api.vid.me/videoByUrl?url=https://vid.me/${id}`,
            { skipStatusCheck: [400] }).then(result => {
        if (!result.status) {
            throw new Error(`Vidme returned an error: ${result.error}`);
        }

        const { video } = result;
        if (video.state !== 'success') {
            throw new Error('Video has not finished uploading successfully');
        }

        const streams = {};
        for (let stream of video.formats) {
            if (/^(360|480|720|1080)p$/.test(stream.type)) {
                streams[stream.type.replace('p', '')] = [{
                    contentType: 'video/mp4',
                    link: stream.uri
                }];
            }
        }

        return new Media({
            id,
            title: video.title,
            duration: video.duration,
            type: 'vidme',
            meta: {
                thumbnail: video.thumbnail_url,
                direct: streams
            }
        });
    });
}

export function parseUrl(url) {
    let m = url.match(/^vm:([\w-]+)$/);
    if (m) {
        return {
            type: 'vidme',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (!['vid.me'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/^\/(?:e\/)?([\w-]+)/);
    if (m) {
        return {
            type: 'vidme',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}
