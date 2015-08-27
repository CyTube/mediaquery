var unitHelper = require('../unit-helper');

describe('LivestreamComStream', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a video with empty options', function (done) {
            unitHelper.runFetchTest('livestream.com', 'barrel_roll', {}, done);
        });
    });
});
