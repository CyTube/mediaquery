var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('DailymotionVideo', function () {
    describe('#fetch', function () {
        it('fetches a dailymotion video', function () {
            return runIntegTest('http://www.dailymotion.com/video/x38tj0m_awesome-firefighting-drone_tv', {});
        });

        it('rejects a missing video', function () {
            return mediaquery.lookup('http://www.dailymotion.com/video/xxxxx').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Not Found');
            });
        });
    });
});
