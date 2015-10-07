var assert = require('assert');
var fs = require('fs');
var path = require('path');
var mediaquery = require('../index');

exports.runIntegTest = function (url, opts) {
    return mediaquery.lookup(url, opts).then(function (media) {
        var expectedFile = path.resolve(__dirname, '..', 'test_data',
                media.type + '_' + media.id.replace(/\//g, '_') + '.json');

        if (!fs.existsSync(expectedFile)) {
            throw new Error('Unexpected result: ' + JSON.stringify(media, null, 2));
        }

        var expected = JSON.parse(fs.readFileSync(expectedFile));
        assert.deepEqual(media, expected);
    });
}
