var unitHelper = require('../unit-helper');

describe('DailymotionPlaylist', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a track with empty options', function (done) {
            unitHelper.runFetchTest('dailymotion-playlist', 'x1ix36', {}, done);
        });
    });
});
