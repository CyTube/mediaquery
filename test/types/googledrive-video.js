var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('GoogleDriveVideo', function () {
    describe('#fetch', function () {
        it('retrieves a Google Drive video', function () {
            return runIntegTest('https://drive.google.com/file/d/0B65A7C_x58chTDlFQ0ZzajQxWFU/edit', {});
        });

        it('rejects when a video is not found', function () {
            return mediaquery.lookup('https://drive.google.com/file/d/aaaa/edit', {}).then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'Google Drive lookup failed: Internal Server Error');
            });
        });

        it('fetches and extracts a Google Drive video with subtitles', function () {
            return runIntegTest('gd:0B_zQqBVn2Hu2cUJxMXc3OWZxR2M', {
                extract: true,
                withSubtitles: true
            });
        });
    });
});
