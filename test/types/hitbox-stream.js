var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('HitboxStream', function () {
    describe('#fetch', function () {
        it('looks up a hitbox stream', function () {
            return runIntegTest('http://www.hitbox.tv/socalprojectm', {});
        });

        it('rejects when a stream is not found', function () {
            return mediaquery.lookup('http://www.hitbox.tv/missing!', {}).then(function () {
                assert(false, 'Expected error due to missing stream');
            }).catch(function (err) {
                assert.equal(err.message, 'Not Found');
            });
        });
    });
});

