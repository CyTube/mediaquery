var assert = require('assert');

var dailymotion = require('../../lib/provider/dailymotion');

describe('Dailymotion', function () {
    describe('#lookup', function () {
        it('should query a public video', function (done) {
            var t = {
                id: 'x2i6zal',
                type: 'dailymotion',
                title: 'These People Just Passed Net Neutrality And Saved The Internet',
                duration: 27,
                meta: {
                    thumbnail: 'http://s1.dmcdn.net/JJV8i/x120-KRb.jpg'
                }
            };

            dailymotion.lookup(t.id).then(function (video) {
                assert.deepEqual(video, t);
                done();
            });
        });
    });
});
