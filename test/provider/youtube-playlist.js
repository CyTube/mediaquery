var assert = require('assert');
var fs = require('fs');
var path = require('path');

var fakerequest = require('./fakerequest');
var YouTubePlaylistProvider = require('../../lib/provider/youtube-playlist');

var youtube;
describe('YouTube v3 Playlists', function () {
    beforeEach(function () {
        youtube = new YouTubePlaylistProvider();
        youtube.setApiKey('test');
    });

    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
        it('should retrieve all items on a playlist', function (done) {
            youtube.lookup('PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E').then(function (videos) {
                assert.ok(videos.length > 50);
                videos.forEach(function (video) {
                    assert.ok(!!video.id);
                    assert.equal(video.type, 'youtube');
                    assert.ok(!!video.title);
                    assert.ok(!!video.duration);
                    assert.ok(!!video.meta.thumbnail);
                });
                done();
            });
        });
    });
});
