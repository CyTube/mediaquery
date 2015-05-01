var assert = require('assert');

var fakerequest = require('./fakerequest');
var dailymotion = require('../../lib/provider/dailymotion');

describe('Dailymotion', function () {
    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
        it('should query a public video', function (done) {
            var t = {
                id: 'x2i6zal',
                type: 'dailymotion',
                title: 'These People Just Passed Net Neutrality And Saved The Internet',
                duration: 27,
                meta: {
                    thumbnail: 'http://s1.dmcdn.net/JJV8i/x120-KRb.jpg'
                }
            };

            dailymotion.lookup(t.id).then(function (video) {
                assert.deepEqual(video, t);
                done();
            });
        });
    });

    describe('#parseUrl', function () {
        it('should parse a dailymotion link', function () {
            var url = 'http://www.dailymotion.com/video/x2j9c73_watch-nasa-test-the-largest-most-powerful-rocket-booster-ever-built_travel';
            var result = dailymotion.parseUrl(url);
            assert.deepEqual(result, {
                id: 'x2j9c73',
                kind: 'single',
                type: 'dailymotion'
            });
        });

        it('should parse a shorthand link', function () {
            var url = 'dm:x2j9c73_watch-nasa-test-the-largest-most-powerful-rocket-booster-ever-built_travel';
            var result = dailymotion.parseUrl(url);
            assert.deepEqual(result, {
                id: 'x2j9c73',
                kind: 'single',
                type: 'dailymotion'
            });
        });
    });
});
