require('source-map-support').install();

var lookup = require('./lib/lookup');
exports.lookupURL = lookup.lookupByURL;
exports.lookupParsedURL = lookup.lookupByParsedURL;
exports.lookup = exports.lookupURL;
exports.parseURL = require('./lib/parseURL');
exports.Media = require('./lib/media');
exports.Playlist = require('./lib/playlist');

var TYPE_MAP = require('./lib/typemap');
exports.setAPIKeys = function (keyMap) {
    for (var type in keyMap) {
        if (typeof TYPE_MAP[type].setAPIKey === 'function') {
            TYPE_MAP[type].setAPIKey(keyMap[type]);
        }
    }
}

exports.types = {};
for (var type in TYPE_MAP) {
    exports.types[TYPE_MAP[type].name] = TYPE_MAP[type];
}
