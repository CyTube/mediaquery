import { getJSON } from '../request';
import Media from '../media';

export function lookup(id) {
    return getJSON(`https://api.streamable.com/videos/${id}`).then(result => {
        switch (result.status) {
            case 0: throw new Error('Video is not done uploading yet');
            case 1: throw new Error('Video is not done processing yet');
            case 3: throw new Error('Video is unavailable');
        }

        let duration = 0;
        for (let key in result.files) {
            const file = result.files[key];

            if (file.status === 2) {
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

    const link = new URL(url);

    if (!['streamable.com'].includes(link.hostname)) {
        return null;
    }

    m = link.pathname.match(/^\/(?:e\/)?([\w-]+)/);
    if (m) {
        return {
            type: 'streamable',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}
