var assert = require('assert');
var fs = require('fs');
var path = require('path');

var googledrive = require('../../lib/provider/googledrive');

describe('Google Drive', function () {

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
