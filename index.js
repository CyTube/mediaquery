require('source-map-support').install();

var lookup = require('./lib/lookup');
exports.lookupByUrl = lookup.lookupByUrl;
exports.lookupByParsedInfo = lookup.lookupByParsedInfo;
exports.lookup = exports.lookupByUrl;
exports.parseUrl = require('./lib/parseUrl');
exports.Media = require('./lib/media');
