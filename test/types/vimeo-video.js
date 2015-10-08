var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var apiKeys = require('../../keys.json');
var oldApiKeys = require('../../keys-vimeoold.json');
var newApiKeys = require('../../keys-vimeonew.json');
var mediaquery = require('../../index');

describe('VimeoVideo', function () {
    describe('#fetch anonymous API', function () {
        beforeEach(function () {
            mediaquery.setAPIKeys({ vimeo: null });
        });

        it('retrieves a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/141403625', {});
        });

        it('retrieves and extracts a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/137643135', {
                extract: true
            });
        });

        it('rejects when a video does not exist', function () {
            return mediaquery.lookup('https://vimeo.com/4444').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Not Found');
            });
        });
    });

    describe('#fetch old API', function () {
        beforeEach(function () {
            mediaquery.setAPIKeys(oldApiKeys);
        });

        it('retrieves a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/141118535', {});
        });

        it('retrieves and extracts a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/141479485', {
                extract: true
            });
        });

        it('rejects when a video does not exist', function () {
            return mediaquery.lookup('https://vimeo.com/4444').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Vimeo returned error: Video not found');
            });
        });
    });

    describe('#fetch new API', function () {
        beforeEach(function () {
            mediaquery.setAPIKeys(newApiKeys);
        });

        it('retrieves a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/141546293', {});
        });

        it('retrieves and extracts a Vimeo video', function () {
            return runIntegTest('https://vimeo.com/139130533', {
                extract: true
            });
        });

        it('rejects when a video does not exist', function () {
            return mediaquery.lookup('https://vimeo.com/4444').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Vimeo returned error: The requested video could not be found');
            });
        });
    });
});
