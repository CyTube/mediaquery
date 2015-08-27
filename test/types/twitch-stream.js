var unitHelper = require('../unit-helper');

describe('TwitchStream', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a video with empty options', function (done) {
            unitHelper.runFetchTest('twitch', 'the4chancup', {}, done);
        });
    });
});
