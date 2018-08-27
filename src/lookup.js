import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';

const PROVIDERS = {
    youtube: require('./provider/youtube'),
    vimeo: require('./provider/vimeo'),
    dailymotion: require('./provider/dailymotion'),
    googledrive: require('./provider/googledrive'),
    streamable: require('./provider/streamable'),
    twitchvod: require('./provider/twitch-vod'),
    twitchclip: require('./provider/twitch-clip'),
    mixer: require('./provider/mixer')
};

export default function lookup(info) {
    if (info == null) {
        return Promise.reject(new Error('No information provided'));
    }

    if (!PROVIDERS.hasOwnProperty(info.type)) {
        return Promise.reject(new Error(`Unknown provider '${info.type}'`));
    }

    const provider = PROVIDERS[info.type];

    switch (info.kind) {
        case 'single':
            return provider.lookup(info.id);
        case 'playlist':
            if ('lookupPlaylist' in provider) {
                return provider.lookupPlaylist(info.id);
            } else {
                return Promise.reject(
                        new Error(`Provider '${info.type}' does not support playlists`));
            }
        default:
            return Promise.reject(new Error(`Unknown info kind '${info.kind}'`));
    }
};
