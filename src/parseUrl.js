import fs from 'fs';
import path from 'path';

const PROVIDERS = fs.readdirSync(path.resolve(__dirname, './provider'))
        .filter(provider => provider.match(/\.js$/))
        .map(provider => require(`./provider/${provider.replace(/\.js$/, '')}`));

export default function parseUrl(url) {
    for (let provider of PROVIDERS) {
        const result = provider.parseUrl(url);
        if (result !== null) {
            return result;
        }
    }
    return null;
};
