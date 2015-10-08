var assert = require('assert');
var runIntegTest = require('../integtest').runIntegTest;
var mediaquery = require('../../index');

describe('FFmpegVideo', function () {
    describe('#fetch', function () {
        it('fetches a webm', function () {
            runIntegTest('http://video.webmfiles.org/big-buck-bunny_trailer.webm', {});
        });

        it('rejects if a link does not give 200 OK', function () {
            return mediaquery.lookup('http://google.com/asdf.mp4').then(function () {
                assert(false, 'Expected error due to missing video');
            }).catch(function (err) {
                assert.equal(err.message, 'www.google.com returned HTTP error 404 Not Found');
            });
        });

        it('rejects if a link does not give correct content-type', function () {
            return mediaquery.lookup('fi:http://google.com/').then(function () {
                assert(false, 'Expected error due to wrong content type');
            }).catch(function (err) {
                assert.equal(err.message, 'The remote server did not send a Content-Type header indicating that the file is a video or audio file.  If this is your server, please check that your server is configured to serve video and audio files with the correct Content-Type.');
            });
        });

        // TODO: More testing around accepted codecs, redirect detection, etc.
    });
});
