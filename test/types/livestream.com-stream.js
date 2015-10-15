var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('LivestreamComStream', function () {
    describe('#fetch', function () {
        it('looks up a livestream.com stream', function () {
            return runIntegTest('http://www.livestream.com/barrel_roll', {});
        });

        it('rejects when a stream is not found', function () {
            return mediaquery.lookup('http://www.livestream.com/__', {}).then(function () {
                assert(false, 'Expected error due to missing stream');
            }).catch(function (err) {
                assert.equal(err.message, 'Not Found');
            });
        });
    });
});

