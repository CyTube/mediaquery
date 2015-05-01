var assert = require('assert');

var fakerequest = require('./fakerequest');
var vimeo = require('../../lib/provider/vimeo');

describe('Vimeo', function () {
    before(fakerequest.init);
    after(fakerequest.reset);

    describe('#lookup', function () {
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
    });
});
