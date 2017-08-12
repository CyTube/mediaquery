import { get as httpGet } from 'http';
import { get as httpsGet } from 'https';
import { parse as urlParse } from 'url';
import Promise from 'bluebird';

const DEFAULT_OPTS = {
    timeout: 30000
};

export function request(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const options = {};

        Object.assign(options, parseURL(url), DEFAULT_OPTS, opts);

        if (!/^https?:$/.test(options.protocol)) {
            reject(new Error(
                `Unacceptable protocol "${options.protocol}"`
            ));

            return;
        }

        // this is fucking stupid
        const get = options.protocol === 'https:' ? httpsGet : httpGet;
        const req = get(options);

        req.setTimeout(options.timeout, () => {
            const error = new Error('Request timed out');
            error.code = 'ETIMEDOUT';
            reject(error);
        });

        req.on('error', error => {
            reject(error);
        });

        req.on('response', res => {
            let buffer = '';
            res.setEncoding('utf8');

            res.on('data', data => {
                buffer += data;

                if (options.maxResponseSize && buffer.length > options.maxResponseSize) {
                    req.abort();
                    reject(new Error('Response size limit exceeded'));
                }
            });

            res.on('end', () => {
                res.data = buffer;
                resolve(res);
            });
        });
    });
}

export function getJSON(url, options = {}) {
    return request(url, options).then(function(res) {
        switch (res.statusCode) {
            // TODO: replace with generic 4xx/5xx detector, remove logic from here
            case 400:
            case 403:
            case 404:
            case 500:
            case 503:
                if (!options.skipStatusCheck
                        || !options.skipStatusCheck.includes(res.statusCode)) {
                    throw new Error(res.statusMessage);
                }
                break;
        }

        try {
            return JSON.parse(res.data);
        } catch (e) {
            throw new Error('Response could not be decoded as JSON');
        }
    });
}

function parseURL(urlstring) {
    const url = urlParse(urlstring);

    // legacy url.parse doesn't check this
    if (url.protocol == null || url.host == null) {
        throw new Error(`Invalid URL "${urlstring}"`);
    }

    return url;
}
