import fs from 'fs';
import path from 'path';

const PROVIDERS = {
    bandcamp:    require('./provider/bandcamp'),
    bitchute:    require('./provider/bitchute'),
    dailymotion: require('./provider/dailymotion'),
    googledrive: require('./provider/googledrive'),
    nicovideo:   require('./provider/nicovideo'),
    odysee:      require('./provider/odysee'),
    peertube:    require('./provider/peertube'),
    streamable:  require('./provider/streamable'),
    twitchclip:  require('./provider/twitch-clip'),
    twitchvod:   require('./provider/twitch-vod'),
    vimeo:       require('./provider/vimeo'),
    youtube:     require('./provider/youtube'),
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
