var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var apiKeys = require('../../keys.json');
var mediaquery = require('../../index');

describe('YouTubeVideo', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            mediaquery.setAPIKeys(apiKeys);
        });

        it('retrieves a YouTube video', function () {
            return runIntegTest('https://www.youtube.com/watch?v=TN4kgwzowBY', {});
        });

        it('sets country restrictions', function () {
            return runIntegTest('https://www.youtube.com/watch?v=1kIsylLeHHU', {});
        });

        it('rejects when failNonEmbeddable is true and the video is not embeddable', function () {
            return mediaquery.lookup('yt:6TT19cB0NTM', {
                failNonEmbeddable: true
            }).then(function () {
                assert(false, 'Expected error due to non-embeddable video');
            }).catch(function (err) {
                assert.equal(err.message, 'The uploader has made this video non-embeddable');
            });
        });

        it('rejects when a video does not exist', function () {
            return mediaquery.lookup('yt:4444').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Video does not exist or is private');
            });
        });

        it('rejects when a video is removed due to copyright claims', function () {
            return mediaquery.lookup('https://www.youtube.com/watch?v=N8sQqElEaCI').then(function () {
                assert(false, 'Expected error due to unavailable video');
            }).catch(function (err) {
                assert.equal(err.message, 'This video is unavailable');
            });
        });

        it('rejects when no API key is set', function () {
            mediaquery.setAPIKeys({ youtube: null });
            return mediaquery.lookup('yt:6TT19cB0NTM').then(function () {
                assert(false, 'Expected error due to missing API key');
            }).catch(function (err) {
                assert.equal(err.message, 'YouTube v3 API requires an API key');
            });
        });
    });
});
