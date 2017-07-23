var assert = require('assert');

var dailymotion = require('../../lib/provider/dailymotion');

describe('Dailymotion', function () {
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
