var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('PicasaWebVideo', function () {
    describe('#fetch', function () {
        it('retrieves a picasaweb video', function () {
            return runIntegTest('picasaweb:101330284704281702022_6002244463538127521_6003070090443592002', {});
        });

        it('retrieves and extracts a picasaweb video', function () {
            return runIntegTest('picasaweb:118168297075505999151_6017192162717927553_6017192166688086178', { extract: true });
        });

        it('rejects when a video does not exist', function () {
            return mediaquery.lookup('picasaweb:a_b_c').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Not Found');
            });
        });
    });
});
