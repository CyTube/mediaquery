var assert = require('assert');

var parseUrl = require('../lib/parseUrl');

var tests = {
    'https://www.youtube.com/watch?v=000al7ru3ms': {
        id: '000al7ru3ms',
        kind: 'single',
        type: 'youtube'
    },
    'https://youtube.com/playlist?list=PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E': {
        id: 'PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E',
        kind: 'playlist',
        type: 'youtube'
    },
    'https://vimeo.com/59859181': {
        id: '59859181',
        kind: 'single',
        type: 'vimeo'
    },
    'http://www.dailymotion.com/video/x2j9c73_watch-nasa-test-the-largest-most-powerful-rocket-booster-ever-built_travel': {
        id: 'x2j9c73',
        kind: 'single',
        type: 'dailymotion'
    }
};

describe('parseUrl', function () {
    for (var url in tests) {
        (function (url) {
            it('should parse ' + url + ' correctly', function () {
                assert.deepEqual(parseUrl(url), tests[url]);
            });
        })(url);
    }
});
