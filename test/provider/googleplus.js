var assert = require('assert');
var fs = require('fs');
var path = require('path');

var fakerequest = require('./fakerequest');
fakerequest(function (url) {
    return url.match(/(\d+)/g).slice().join('_');
});

var googleplus = require('../../lib/provider/googleplus');

function verify(actual, id) {
    var raw = fs.readFileSync(path.resolve(__dirname, '..', 'fixtures', id + '.json')) + '';
    var expected = JSON.parse(raw);
    assert.deepEqual(actual, expected);
}

describe('Google+', function () {
    describe('#lookup', function () {
        var id = '100620752621750099557_6017240248591052001_6017261392637740978';
        it('should look up a video correctly', function (done) {
            googleplus.lookup(id).then(function (video) {
                verify(video, id);
                done();
            });
        });
    });

    after(fakerequest.reset);
});
