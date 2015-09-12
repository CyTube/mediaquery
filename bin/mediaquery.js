var mediaquery = require('../index');
var Promise = require('bluebird');

var extract = false;
var lookups = [];
try {
    var apiKeyMap = require('../keys.json');
    mediaquery.setAPIKeys(apiKeyMap);
} catch (e) {
    console.error('Warning: Unable to load API keys from keys.json.');
}

process.argv.slice(2).forEach(function (arg) {
    if (arg === '-e' || arg === '--extract') {
        extract = true;
        return;
    } else if (arg === '-h' || arg === '--help') {
        console.log('Usage: ' + process.argv[1] + ' [-e] URL [URL ...]');
        console.log('-e (--extract): Extract raw video links');
        console.log('-h (--help): Display this help');
        return process.exit(0);
    }
    lookups.push(arg);
});

var opts = {
    extract: true,
    withSubtitles: true,
    failNonEmbeddable: false
};

Promise.reduce(lookups, function (_, url) {
    return mediaquery.lookup(url, opts).then(function (media) {
        console.log(JSON.stringify(media, null, 4));
    }).catch(function (err) {
        console.error('Lookup failed for ' + url + ': ' + err.stack);
    });
}, null).then(function () {
    process.exit(0);
}).catch(function (err) {
    console.error(err.stack);
    process.exit(1);
});
