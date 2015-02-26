var assert = require('assert');
var fs = require('fs');
var path = require('path');

var youtube = require('../../lib/provider/youtube');

var API_KEY = fs.readFileSync(path.join(__dirname, '..', 'keys', 'youtube')) + '';

describe('YouTube v3', function () {
    beforeEach(function () {
        youtube.setApiKey(API_KEY);
    });

    it('should query a public video', function (done) {
        var t = {
            id: 'tBfE9UPTfg8',
            type: 'youtube',
            title: 'Mystery Skulls - "Magic" feat. Brandy and Nile Rodgers [Official Audio]',
            duration: 269,
            meta: { thumbnail: 'https://i.ytimg.com/vi/tBfE9UPTfg8/default.jpg' }
        };

        youtube.lookup(t.id).then(function (media) {
            assert.deepEqual(media, t);
            done();
        }).catch(function (e) {
            throw e;
        });
    });

    it('should set region restrictions', function (done) {
        var t = {
            id: 'CLlRv1Ja0Pk',
            type: 'youtube',
            title: 'David Benoit  -  Freedom At Midnight',
            duration: 255,
            meta: {
                thumbnail: 'https://i.ytimg.com/vi/CLlRv1Ja0Pk/default.jpg',
                blocked: [ 'DE' ]
            }
        };

        youtube.lookup(t.id).then(function (media) {
            assert.deepEqual(media, t);
            done();
        }).catch(function (e) {
            throw e;
        });
    });

    it('should detect non-embeddability', function (done) {
        youtube.lookup('1kIsylLeHHU').then(function (media) {
            assert.ok(false, 'Should not succeed with non-embeddable video');
        }).catch(function (e) {
            assert.equal(e.message, 'Video is not embeddable');
            done();
        });
    });

    it('should return an error if the video does not exist', function (done) {
        youtube.lookup('111111111111111111').then(function (media) {
            assert.ok(false, 'Should not succeed with missing video');
        }).catch(function (e) {
            assert.equal(e.message, 'Video does not exist or is private');
            done();
        });
    });

    it('should throw an error if the API key is not set', function (done) {
        youtube.setApiKey(null);
        youtube.lookup('').then(function () {
            assert.ok(false, 'Success callback should not be invoked');
        }).catch(function (err) {
            assert.equal(err.message, 'API key not set for YouTube v3 API');
            done();
        });
    });

    it('should query multiple videos', function (done) {
        var t = [{
            id: 'tBfE9UPTfg8',
            type: 'youtube',
            title: 'Mystery Skulls - "Magic" feat. Brandy and Nile Rodgers [Official Audio]',
            duration: 269,
            meta: { thumbnail: 'https://i.ytimg.com/vi/tBfE9UPTfg8/default.jpg' }
        }, {
            id: 'CLlRv1Ja0Pk',
            type: 'youtube',
            title: 'David Benoit  -  Freedom At Midnight',
            duration: 255,
            meta: {
                thumbnail: 'https://i.ytimg.com/vi/CLlRv1Ja0Pk/default.jpg',
                blocked: [ 'DE' ]
            }
        }];

        youtube.lookupMany(t.map(function (x) { return x.id })).then(function (results) {
            assert.deepEqual(results, t);
            done();
        }).catch(function (e) {
            throw e;
        });
    });

    it('should search and return a list of Media', function (done) {
        youtube.search('Mystery Skulls Ghost Animated').then(function (result) {
            var videos = result.results;
            videos.forEach(function (video) {
                assert.ok(!!video.id);
                assert.equal(video.type, 'youtube');
                assert.ok(!!video.title);
                assert.ok(!!video.duration);
                assert.ok(!!video.meta.thumbnail);
            });
            done();
        }).catch(function (e) {
            throw e;
        });
    });

    it('should search the next page when provided', function (done) {
        this.timeout(10000); // lol the API is slow
        var query = 'Mystery Skulls Ghost Animated';
        var firstPage;
        youtube.search(query).then(function (result) {
            firstPage = result.results;
            return youtube.search(query, result.nextPage);
        }).then(function (result) {
            var videos = result.results;
            assert.notDeepEqual(videos, firstPage);
            done();
        }).catch(function (e) {
            throw e;
        });
    });

    it('should retrieve all items on a playlist', function (done) {
        this.timeout(10000); // lol the API is slow
        youtube.lookupPlaylist('PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E')
                .then(function (videos) {
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
