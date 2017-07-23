var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var vimeo = require('../../lib/provider/vimeo');

describe('Vimeo', function () {
    describe('#parseUrl', function () {
        it('should parse a vimeo.com link', function () {
            var result = vimeo.parseUrl('https://vimeo.com/59859181');
            assert.deepEqual(result, {
                type: 'vimeo',
                kind: 'single',
                id: '59859181'
            });
        });

        it('should not parse a non-video link', function () {
            var result = vimeo.parseUrl('https://vimeo.com/staff');
            assert.deepEqual(result, null);
        });

        it('should parse a shorthand link', function () {
            var result = vimeo.parseUrl('vi:59859181');
            assert.deepEqual(result, {
                type: 'vimeo',
                kind: 'single',
                id: '59859181'
            });
        });
    });
});
