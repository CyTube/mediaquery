var unitHelper = require('../unit-helper');

describe('UstreamStream', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a video with empty options', function (done) {
            unitHelper.runFetchTest('ustream', 'channel/iss-hdev-payload', {}, done);
        });
    });
});
