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
            assert.assertTrue(false, 'Should not succeed with non-embeddable video');
        }).catch(function (e) {
            assert.equal(e.message, 'Video is not embeddable');
            done();
        });
    });

    it('should return an error if the video does not exist', function (done) {
        youtube.lookup('111111111111111111').then(function (media) {
            assert.assertTrue(false, 'Should not succeed with missing video');
        }).catch(function (e) {
            assert.equal(e.message, 'Video does not exist or is private');
            done();
        });
    });

    it('should throw an error if the API key is not set', function (done) {
        youtube.setApiKey(null);
        youtube.lookup('').then(function () {
            assert.assertTrue(false, 'Success callback should not be invoked');
        }).catch(function (err) {
            assert.equal(err.message, 'API key not set for YouTube v3 API');
            done();
        });
    });
});
