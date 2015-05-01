var Promise = require('bluebird');
var request = require('../../lib/request');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var srcdir = path.resolve(__dirname, '..', 'fixtures');

function md5(input) {
    var hash = crypto.createHash('md5');
    hash.update(input);
    return hash.digest('hex');
}

function fakeRequest(url) {
    var fpath = path.join(srcdir, md5(url) + '.txt');
    var data = (fs.readFileSync(fpath) + '').split('\r\n\r\n');
    var headers = data[0];
    var status = headers.match(/HTTP\/1\.\d (\d+) ([^\r\n]+)/);
    var body = data[1];

    return new Promise(function (resolve, reject) {
        resolve({
            statusCode: parseInt(status[1]),
            statusMessage: status[2],
            data: body
        });
    });
}

function fakeGetJSON(url) {
    return fakeRequest(url).then(function (res) {
        switch (res.statusCode) {
            case 400:
            case 403:
            case 404:
            case 500:
            case 503:
                throw new Error(res.statusMessage);
        }

        var data;
        try {
            data = JSON.parse(res.data);
        } catch (e) {
            throw new Error('Response could not be decoded as JSON');
        }

        return data;
    });
}

module.exports = {
    init: function () {
        request.__testpatch(fakeRequest);
    },
    reset: function () {
        request.__untestpatch();
    }
};
