import http from 'http';
import https from 'https';
import urlparse from 'url';
import Promise from 'bluebird';

export function request(url, options = {}) {
    return new Promise(function(resolve, reject) {
        const parsed = urlparse.parse(url);
        if (!parsed.protocol || !parsed.protocol.match(/^https?:$/)) {
            return reject(new Error(`Invalid protocol '${parsed.protocol}'`));
        }

        const transport = parsed.protocol === 'https:' ? https : http;
        for (let key in options) {
            const val = options[key];
            parsed[key] = val;
        }
        const req = transport.get(parsed, res => {
            let buffer = '';
            res.on('data', data => buffer += data);

            return res.on('end', () => {
                res.data = buffer;
                return resolve(res);
            });
        });

        return req.on('error', err => reject(err));
    });
}

export function getJSON(url, options = {}) {
    return request(url, options).then(function(res) {
        switch (res.statusCode) {
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
