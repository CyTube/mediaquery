require('source-map-support').install();

var lookup = require('./lib/lookup');
exports.lookupByUrl = lookup.lookupByUrl;
exports.lookupByParsedInfo = lookup.lookupByParsedInfo;
exports.lookup = exports.lookupByUrl;
exports.parseUrl = require('./lib/parseUrl');
exports.Media = require('./lib/media');

var TYPE_MAP = require('./lib/typemap');
exports.setApiKeys = function (keyMap) {
    for (var type in keyMap) {
        if (typeof TYPE_MAP[type].setApiKey === 'function') {
            TYPE_MAP[type].setApiKey(keyMap[type]);
        }
    }
}
