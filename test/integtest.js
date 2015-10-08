var assert = require('assert');
var fs = require('fs');
var path = require('path');
var mediaquery = require('../index');

function compare(obj1, obj2) {
    Object.keys(obj1).forEach(function (key) {
        if (!obj1.hasOwnProperty(key)) return;
        var val1 = obj1[key];
        var val2 = obj2[key];
        if (typeof val1 !== typeof val2) {
            throw new Error('Not equal');
        }

        if (typeof val1 === 'object') {
            compare(val1, val2);
        } else if (typeof val1 === 'string') {
            var match = /MATCH:(.*)/.exec(val1);
            if (val1 !== val2 && !(match && (new RegExp(match[1]).test(val2)))) {
                throw new Error('Not equal');
            }
        } else if (val1 !== val2) {
            throw new Error('Not equal');
        }
    });

    Object.keys(obj2).forEach(function (key) {
        if (!obj2.hasOwnProperty(key)) return;
        if (!obj1.hasOwnProperty(key)) {
            throw new Error('Not equal');
        }
    });
}

exports.runIntegTest = function (url, opts) {
    return mediaquery.lookup(url, opts).then(function (media) {
        var expectedFile = path.resolve(__dirname, '..', 'test_data',
                media.type + '_' + media.id.replace(/[\/:]/g, '_') + '.json');

        if (!fs.existsSync(expectedFile)) {
            throw new Error('Unexpected result: ' + JSON.stringify(media, null, 2));
        }

        var expected = JSON.parse(fs.readFileSync(expectedFile));
        try {
            compare(expected, media);
        } catch (e) {
            throw new Error('Equality assertion failed: Expected\n' +
                    JSON.stringify(expected, null, 2) + '\nActual\n' +
                    JSON.stringify(media, null, 2));
        }
    });
}

describe('compare() internal test helper', function () {
    it('detects correctly', function () {
        compare({a: 1}, {a: 1});
        compare({a: 'MATCH:\\d'}, {a: '4'});
        assert.throws(function (){
            compare({a: 'MATCH:\\d'}, {a: 'x'});
        });
        assert.throws(function (){
            compare({a: 42}, {});
        });
    });
});
