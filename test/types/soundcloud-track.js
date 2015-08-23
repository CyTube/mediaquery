var unitHelper = require('../unit-helper');

describe('SoundcloudTrack', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a track with empty options', function (done) {
            unitHelper.runFetchTest('soundcloud',
                    'prettylights/pretty-lights-the-hot-sht-episode-186', {}, done);
        });
    });
});
