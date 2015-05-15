var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var fakerequest = require('./fakerequest');
var request = require('../../lib/request');
var vimeo = require('../../lib/provider/vimeo');

function verify(actual, id) {
    var raw = fs.readFileSync(path.resolve(__dirname, '..', 'fixtures', id + '.json')) + '';
    var expected = JSON.parse(raw);
    assert.deepEqual(actual, expected);
}

describe('Vimeo', function () {
    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
        it('should query a video', function (done) {
            var t = {
                id: '59859181',
                type: 'vimeo',
                title: 'High Maintenance / /  Dinah',
                duration: 676,
                meta: {
                    thumbnail: 'https://i.vimeocdn.com/video/416672085_200x150.jpg'
                }
            };

            vimeo.lookup(t.id).then(function (result) {
                assert.deepEqual(result, t);
                done();
            }).catch(function (e) {
                throw e;
            });
        });
    });

    describe('#parseUrl', function () {
        it('should parse a vimeo.com link', function () {
            var result = vimeo.parseUrl('https://vimeo.com/59859181');
            assert.deepEqual(result, {
                type: 'vimeo',
                kind: 'single',
                id: '59859181'
            });
        });

        it('should not parse a non-video link', function () {
            var result = vimeo.parseUrl('https://vimeo.com/staff');
            assert.deepEqual(result, null);
        });

        it('should parse a shorthand link', function () {
            var result = vimeo.parseUrl('vi:59859181');
            assert.deepEqual(result, {
                type: 'vimeo',
                kind: 'single',
                id: '59859181'
            });
        });
    });

    describe('#lookupAndExtract', function () {
        it('should look up and extract video data', function (done) {
            var id = '126820040';
            vimeo.lookupAndExtract(id).then(function (video) {
                verify(video, id);
                done();
            })
        });
    });

    describe('#extract', function () {
        fakerequest.reset();

        var HEADERS = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0'
        };

        before(function () {
            request.__testpatch(function (url, headers) {
                assert.deepEqual(headers, HEADERS);

                return Promise.resolve({
                    statusCode: 404
                });
            });
        });

        after(function () {
            request.__untestpatch();
        });

        it('should send the correct User-Agent', function (done) {
            var id = '126820040';
            vimeo.extract(id).then(function () {
                done();
            })
        });
    });
});
