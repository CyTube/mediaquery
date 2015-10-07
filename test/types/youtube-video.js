var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var apiKeys = require('../../keys.json');
var mediaquery = require('../../index');

describe('YouTubeVideo', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            mediaquery.setAPIKeys(apiKeys);
        });

        afterEach(function () {
            mediaquery.setAPIKeys({});
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
    });
});
