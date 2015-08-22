var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var urlparse = require('url');
var request = require('../lib/request');
var actualRequest = request.request;

var apiKeys = require('../keys.json');
require('../index').setApiKeys(apiKeys);

function md5(input) {
    var hash = crypto.createHash('md5');
    hash.update(input);
    return hash.digest('hex');
}

function urlToFilename(url) {
    for (var type in apiKeys) {
        url = url.replace(new RegExp(apiKeys[type], 'g'), 'dummy_key');
    }

    var data = urlparse.parse(url);
    return data.hostname + '_' + md5(url);
}

function proxyRequest(url, headers) {
    return actualRequest(url, headers).then(function (res) {
        var data = 'HTTP/1.1 ' + res.statusCode + ' ' + res.statusMessage + '\r\n\r\n';
        data += res.data;
        var dest = path.resolve(__dirname, '..', 'test_data',
                urlToFilename(url) + '.txt');
        fs.writeFileSync(dest, data);
        console.log('Saved ' + dest);
        return res;
    });
}

request.__testpatch(proxyRequest);

var TYPE_MAP = require('../lib/typemap');
var type = process.argv[2];
var id = process.argv[3];
var opts = {};
if (process.argv[4]) {
    opts = JSON.parse(process.argv[4]);
}

var constructor = TYPE_MAP[type];
var dest = path.resolve(__dirname, '..', 'test_data', type + '_' + id + '.json');

new constructor(id).fetch(opts).then(function (video) {
    fs.writeFileSync(dest, JSON.stringify(video, null, 4));
    console.log('Saved ' + dest);
}).catch(function (err) {
    console.log('Warning: response for ' + type + ':' + id + ' was an error: ' +
            err.stack);
    fs.writeFileSync(dest, JSON.stringify({
        message: err.message
    }, null, 4));
    console.log('Saved ' + dest);
});
