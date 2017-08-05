import domutils from 'domutils';
import { parseDom } from '../util/xmldom';
import querystring from 'querystring';
import urlparse from 'url';

import { request } from '../request';
import Media from '../media';
import { ITAG_QMAP, ITAG_CMAP } from '../util/itag';

const LOGGER = require('@calzoneman/jsli')('mediaquery/googledrive');

const extractHexId = function(url) {
    const m = url.match(/vid=([\w-]+)/);
    if (m) {
        return m[1];
    } else {
        return null;
    }
};

function fetchAndParse(id, options = {}) {
    const url = `https://docs.google.com/get_video_info?authuser=&docid=${id}&sle=true&hl=en`;

    return request(url, options).then(function(res) {
        if (res.statusCode !== 200) {
            throw new Error(`Google Drive lookup failed for ${id}: ${res.statusMessage}`);
        }

        const doc = querystring.parse(res.data);

        if (doc.status !== 'ok') {
            let reason;
            if (doc.reason.match(/You must be signed in to access/)) {
                reason = 'Google Drive videos must be shared publicly';
            } else {
                reason = `Google Drive flagged this video as unplayable: ${doc.reason}`;
            }

            throw new Error(reason);
        }

        const videos = {
            1080: [],
            720: [],
            480: [],
            360: []
        };

        doc.fmt_stream_map.split(',').forEach(source => {
            let [itag, url] = source.split('|');
            itag = parseInt(itag, 10);

            if (ITAG_QMAP.hasOwnProperty(itag)) {
                return;
            }

            return videos[ITAG_QMAP[itag]].push({
                itag,
                contentType: ITAG_CMAP[itag],
                link: url
            });
        });

        const data = {
            id,
            type: 'googledrive',
            title: doc.title,
            duration: parseInt(doc.length_seconds, 10),
            meta: {
                thumbnail: doc.iurl,
                direct: videos
            }
        };

        if (options.fetchSubtitles) {
            return getSubtitles(id, extractHexId(doc.ttsurl)).then(subtitles => {
                if (subtitles) {
                    data.meta.gdrive_subtitles = subtitles;
                }
                return new Media(data);
            });
        } else {
            return new Media(data);
        }
    });
};

export function lookup(id) {
    return fetchAndParse(id, { fetchSubtitles: true });
}

export function getSubtitles(id, vid) {
    const params = {
        id,
        v: id,
        vid,
        type: 'list',
        hl: 'en-US'
    };

    const url = `https://drive.google.com/timedtext?${querystring.stringify(params)}`;
    return request(url).then(res => {
        if (res.statusCode !== 200) {
            throw new Error(`Google Drive subtitle lookup failed for ${id}: \
${res.statusMessage} (url: ${url})`);
        }

        const subtitles = {
            vid,
            available: []
        };

        domutils.findAll(elem => elem.name === 'track', parseDom(res.data))
                .forEach(elem => {
            subtitles.available.push({
                lang: elem.attribs.lang_code,
                lang_original: elem.attribs.lang_original,
                name: elem.attribs.name
            });
        });

        return subtitles;
    }).catch(err => {
        LOGGER.error("Failed to retrieve subtitles: %s", err.stack)
    });
}

export function parseUrl(url) {
    let m = url.match(/^gd:([\w-]+)$/);
    if (m) {
        return {
            type: 'googledrive',
            kind: 'single',
            id: m[1]
        };
    }

    const data = urlparse.parse(url, true);

    if (!['drive.google.com', 'docs.google.com'].includes(data.hostname)) {
        return null;
    }

    m = data.pathname.match(/file\/d\/([\w-]+)/);
    if (!m) {
        if (data.pathname === '/open') {
            m = data.search.match(/id=([\w-]+)/);
        }
    }

    if (m) {
        return {
            type: 'googledrive',
            kind: 'single',
            id: m[1]
        };
    }

    return null;
}
