var assert = require('assert');
var fs = require('fs');
var path = require('path');

var fakerequest = require('./fakerequest');

var googleplus = require('../../lib/provider/googleplus');

function verify(actual, id) {
    var raw = fs.readFileSync(path.resolve(__dirname, '..', 'fixtures', id + '.json')) + '';
    var expected = JSON.parse(raw);
    assert.deepEqual(actual, expected);
}

describe('Google+', function () {
    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
        it('should look up a video correctly', function (done) {
            var id = '100620752621750099557_6017240248591052001_6017261392637740978';
            googleplus.lookup(id).then(function (video) {
                verify(video, id);
                done();
            });
        });

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
