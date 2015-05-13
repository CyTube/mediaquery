var assert = require('assert');
var fs = require('fs');
var path = require('path');

var fakerequest = require('./fakerequest');

var googledrive = require('../../lib/provider/googledrive');

function verify(actual, id) {
    var raw = fs.readFileSync(path.resolve(__dirname, '..', 'fixtures', id + '.json')) + '';
    var expected = JSON.parse(raw);
    assert.deepEqual(actual, expected);
}

describe('Google Drive', function () {
    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
        it('should look up a video correctly', function (done) {
            var id = '0B4cFvr_DtemaYWthdldSUTJjZlE';
            googledrive.lookup(id).then(function (video) {
                verify(video, id);
                done();
            });
        });
    });

    describe('#parseUrl', function () {
        it('should parse a docs.google.com/file/d/ link correctly', function () {
            var url = 'https://docs.google.com/file/d/0B4cFvr_DtemaYWthdldSUTJjZlE/edit';
            assert.deepEqual(googledrive.parseUrl(url), {
                id: '0B4cFvr_DtemaYWthdldSUTJjZlE',
                type: 'googledrive',
                kind: 'single'
            });
        });

        it('should parse a drive.google.com/file/d/ link correctly', function () {
            var url = 'https://drive.google.com/file/d/0B4cFvr_DtemaYWthdldSUTJjZlE/edit';
            assert.deepEqual(googledrive.parseUrl(url), {
                id: '0B4cFvr_DtemaYWthdldSUTJjZlE',
                type: 'googledrive',
                kind: 'single'
            });
        });

        it('should parse a drive.google.com/open link correctly', function () {
            var url = 'https://drive.google.com/open?id=0B4cFvr_DtemaYWthdldSUTJjZlE';
            assert.deepEqual(googledrive.parseUrl(url), {
                id: '0B4cFvr_DtemaYWthdldSUTJjZlE',
                type: 'googledrive',
                kind: 'single'
            });
        });

        it('should parse a gd: shorthand link correctly', function () {
            var url = 'gd:0B4cFvr_DtemaYWthdldSUTJjZlE';
            assert.deepEqual(googledrive.parseUrl(url), {
                id: '0B4cFvr_DtemaYWthdldSUTJjZlE',
                type: 'googledrive',
                kind: 'single'
            });
        });
    });
});
