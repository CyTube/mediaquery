var assert = require('assert');

var vimeo = require('../../lib/provider/vimeo');

describe('Vimeo', function () {
    it('should query a video', function (done) {
        var t = {
            id: '59859181',
            type: 'vimeo',
            title: 'High Maintenance / /  Dinah',
            duration: 676,
            meta: {
                thumbnail: 'https://i.vimeocdn.com/video/416672085_200x150.jpg'
            }
        };

        vimeo.lookup(t.id).then(function (result) {
            assert.deepEqual(result, t);
            done();
        }).catch(function (e) {
            throw e;
        });
    });
});
