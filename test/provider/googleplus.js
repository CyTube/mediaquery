var assert = require('assert');
var fs = require('fs');
var path = require('path');

var googleplus = require('../../lib/provider/googleplus');

describe('Google+', function () {
    describe('#parseUrl', function () {
        it('should parse a link', function () {
            var url = 'https://plus.google.com/photos/100620752621750099557/albums/6017240248591052001/6017261392637740978/';
            assert.deepEqual(googleplus.parseUrl(url), {
                id: '100620752621750099557_6017240248591052001_6017261392637740978',
                type: 'google+',
                kind: 'single'
            });
        });

        it('should parse a link with /u/0', function () {
            var url = 'https://plus.google.com/u/0/photos/100620752621750099557/albums/6017240248591052001/6017261392637740978/';
            assert.deepEqual(googleplus.parseUrl(url), {
                id: '100620752621750099557_6017240248591052001_6017261392637740978',
                type: 'google+',
                kind: 'single'
            });
        });

        it('should parse a shorthand link', function () {
            var url = 'gp:100620752621750099557_6017240248591052001_6017261392637740978';
            assert.deepEqual(googleplus.parseUrl(url), {
                id: '100620752621750099557_6017240248591052001_6017261392637740978',
                type: 'google+',
                kind: 'single'
            });
        });
    });
});
