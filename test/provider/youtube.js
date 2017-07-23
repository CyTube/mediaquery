var assert = require('assert');
var fs = require('fs');
var path = require('path');

var youtube = require('../../lib/provider/youtube');

describe('YouTube v3', function () {
    beforeEach(function () {
        youtube.setApiKey('test');
    });

    describe('#lookup', function () {
        it('should throw an error if the API key is not set', function (done) {
            youtube.setApiKey(null);
            youtube.lookup('').then(function () {
                assert.ok(false, 'Success callback should not be invoked');
            }).catch(function (err) {
                assert.equal(err.message, 'API key not set for YouTube v3 API');
                done();
            });
        });
    });

    describe('#parseUrl', function () {
        it('should parse a youtu.be link', function () {
            var result = youtube.parseUrl('https://youtu.be/000al7ru3ms');
            assert.deepEqual(result, {
                id: '000al7ru3ms',
                type: 'youtube',
                kind: 'single'
            });
        });

        it('should parse a youtube.com video link', function () {
            var result = youtube.parseUrl('https://www.youtube.com/watch?v=000al7ru3ms');
            assert.deepEqual(result, {
                id: '000al7ru3ms',
                type: 'youtube',
                kind: 'single'
            });
        });

        it('should parse a youtube.com video link with extra URL garbage', function () {
            var url = 'https://youtube.com/watch?feature=player_embedded&v=000al7ru3ms';
            var result = youtube.parseUrl(url);
            assert.deepEqual(result, {
                id: '000al7ru3ms',
                type: 'youtube',
                kind: 'single'
            });
        });

        it('should parse a youtube.com playlist link', function () {
            var url = 'https://youtube.com/playlist?list=PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E';
            var result = youtube.parseUrl(url);
            assert.deepEqual(result, {
                id: 'PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E',
                type: 'youtube',
                kind: 'playlist'
            });
        });

        it('should not parse a non-video link', function () {
            var result = youtube.parseUrl('https://www.youtube.com/user/JonTronShow');
            assert.deepEqual(result, null);
        });

        it('should parse a shorthand link', function () {
            var result = youtube.parseUrl('yt:000al7ru3ms');
            assert.deepEqual(result, {
                id: '000al7ru3ms',
                type: 'youtube',
                kind: 'single'
            });
        });

        it('should parse a shorthand link for playlists', function () {
            var result = youtube.parseUrl('yp:PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E');
            assert.deepEqual(result, {
                id: 'PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E',
                type: 'youtube',
                kind: 'playlist'
            });
        });
    });
});
