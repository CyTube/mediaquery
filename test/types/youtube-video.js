var unitHelper = require('../unit-helper');

describe('YouTubeVideo', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a video with empty options', function (done) {
            unitHelper.runFetchTest('youtube', 'TN4kgwzowBY', {}, done);
        });

        it('processes a video with region restrictions', function (done) {
            unitHelper.runFetchTest('youtube', 'LHepJeSYr4E', {}, done);
        });

        it('fails when failNonEmbeddable = true', function (done) {
            unitHelper.runFetchTest('youtube', '1kIsylLeHHU', {
                failNonEmbeddable: true
            }, done);
        });

        it('does not fail when failNonEmbeddable = false', function (done) {
            unitHelper.runFetchTest('youtube', 'LHLHepJeSYr4E_nonembeddable', {
                failNonEmbeddable: false
            }, done);
        });
    });
});
