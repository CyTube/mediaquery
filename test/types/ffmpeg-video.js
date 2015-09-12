var assert = require('assert');
var http = require('http');
var path = require('path');
var Promise = require('bluebird');
var FFmpegVideo = require('../../lib/types/ffmpeg-video');

var PORT = 3737;

describe('FFmpegVideo', function () {
    describe('#_preTestLink', function () {
        var reqhandler,
            server,
            dummyURL = 'http://localhost:' + PORT + '/video.mp4';

        beforeEach(function (done) {
            FFmpegVideo.prototype.__runFFprobe = FFmpegVideo.prototype._runFFprobe;
            FFmpegVideo.prototype._runFFprobe = function () { };
            server = http.createServer(function (req, res) {
                reqhandler(req, res);
            });

            server.listen(PORT);

            server.on('listening', done);
        });

        afterEach(function (done) {
            FFmpegVideo.prototype._runFFprobe = FFmpegVideo.prototype.__runFFprobe;
            delete FFmpegVideo.prototype.__runFFprobe;
            server.close(done);
        });

        it('rejects links with too many redirects', function (done) {
            reqhandler = function (req, res) {
                res.writeHead(301, {
                    'Location': dummyURL
                });
                res.end();
            };

            new FFmpegVideo(dummyURL).fetch().then(function () {
                assert.fail('Should not have completed successfully');
            }).catch(function (err) {
                assert('Error message should be too many redirects',
                        err.message.match(/Too many redirects/));
                done();
            });
        });

        it('rejects links with wrong content-type', function (done) {
            reqhandler = function (req, res) {
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream'
                });
                res.end();
            };

            new FFmpegVideo(dummyURL).fetch().then(function () {
                assert.fail('Should not have completed successfully');
            }).catch(function (err) {
                assert('Error message should be wrong content-type',
                        err.message.match(/Content-Type/));
                done();
            });
        });

        it('accepts valid video links', function (done) {
            reqhandler = function (req, res) {
                res.writeHead(200, {
                    'Content-Type': 'video/mp4'
                });
                res.end();
            };

            new FFmpegVideo(dummyURL).fetch().then(done);
        });

        it('accepts valid audio links', function (done) {
            reqhandler = function (req, res) {
                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg'
                });
                res.end();
            };

            new FFmpegVideo(dummyURL).fetch().then(done);
        });
    });

    describe('#_runFFprobe', function () {
        beforeEach(function () {
            FFmpegVideo.prototype.__preTestLink = FFmpegVideo.prototype._preTestLink;
            FFmpegVideo.prototype._preTestLink = function () {
                return Promise.resolve();
            };
            FFmpegVideo.prototype.__parseFFprobeOutput = FFmpegVideo.prototype._parseFFprobeOutput;
            FFmpegVideo.prototype._parseFFprobeOutput = function () {
                return Promise.resolve(this);
            };
        });

        afterEach(function () {
            FFmpegVideo.prototype._preTestLink = FFmpegVideo.prototype.__preTestLink;
            delete FFmpegVideo.prototype.__preTestLink;
            FFmpegVideo.prototype._parseFFprobeOutput = FFmpegVideo.prototype.__parseFFprobeOutput;
            delete FFmpegVideo.prototype.__parseFFprobeOutput;
        });

        it('kills the process after a timeout', function (done) {
            FFmpegVideo.setFFprobeExecutable(
                path.join(__dirname, '..', '..', 'test_data','ffprobe-dummy-timeout.js')
            );
            FFmpegVideo.setTimeout(10);
            new FFmpegVideo('http://ffprobe-dummy/video.mp4').fetch().then(function () {
                assert.fail('Should not have succeeded after timeout');
            }).catch(function (err) {
                assert('Should raise tiemout error',
                       err.message.match(/exceeded the timeout/));
                done();
            });
        });
    });
});
