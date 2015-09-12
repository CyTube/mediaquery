var unitHelper = require('../unit-helper');

describe('VimeoVideo', function () {
    describe('#fetch', function () {
        beforeEach(function () {
            unitHelper.setUp();
        });

        afterEach(function () {
            unitHelper.reset();
        });

        it('processes a video with extract true', function (done) {
            unitHelper.runFetchTest('vimeo', '138589237', {
                extract: true,
                noAPIKey: true
            }, done);
        });
    });
});
