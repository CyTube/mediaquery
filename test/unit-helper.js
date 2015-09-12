var Promise = require('bluebird');
var request = require('../lib/request');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var urlparse = require('url');
var TYPE_MAP = require('../lib/typemap');
var assert = require('assert');

var datadir = path.resolve(__dirname, '..', 'test_data');

function md5(input) {
    var hash = crypto.createHash('md5');
    hash.update(input);
    return hash.digest('hex');
}

function urlToFilename(url) {
    var data = urlparse.parse(url);
    return data.hostname + '_' + md5(url);
}

function mockRequest(url) {
    var fpath = path.join(datadir, urlToFilename(url) + '.txt');
    var data = (fs.readFileSync(fpath) + '').split('\r\n\r\n');
    var headers = data[0];
    var status = headers.match(/HTTP\/1\.\d (\d+) ([^\r\n]+)/);
    var headerMap = {};
    var m = headers.match(/Location: (.*)/);
    if (m) {
        headerMap['location'] = m[1];
    }
    var body = data[1];

    return new Promise(function (resolve, reject) {
        resolve({
            statusCode: parseInt(status[1]),
            statusMessage: status[2],
            data: body,
            headers: headerMap
        });
    });
}

exports.setUp = function () {
    request.__testpatch(mockRequest);
};

exports.reset = function () {
    request.__untestpatch();
};

exports.runFetchTest = function (type, id, opts, done) {
    var fpath = path.join(datadir, type + '_' + id.replace(/\//g, '_') + '.json');
    var expected = JSON.parse(fs.readFileSync(fpath) + '');
    var constructor = TYPE_MAP[type];
    if (constructor.setAPIKey && !opts.noAPIKey) {
        constructor.setAPIKey('dummy_key');
    }

    new constructor(id).fetch(opts).then(function (video) {
        video = JSON.parse(JSON.stringify(video));
        assert.deepEqual(video, expected);
        setImmediate(done);
    }).catch(function (err) {
        if (err instanceof assert.AssertionError) {
            throw err;
        }
        assert.deepEqual({ message: err.message }, expected);
        setImmediate(done);
    });
};
