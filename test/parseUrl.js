var assert = require('assert');

var parseURL = require('../lib/parseURL');

var tests = {
    'https://www.youtube.com/watch?v=000al7ru3ms': {
        id: '000al7ru3ms',
        type: 'youtube'
    },
    'https://youtube.com/playlist?list=PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E': {
        id: 'PLVXq77mXV539VYxMIcXeQMOv3Ffo22z5E',
        type: 'youtube-playlist'
    },
    'https://vimeo.com/59859181': {
        id: '59859181',
        type: 'vimeo'
    },
    'http://www.dailymotion.com/video/x2j9c73_watch-nasa-test-the-largest-most-powerful-rocket-booster-ever-built_travel': {
        id: 'x2j9c73',
        type: 'dailymotion'
    }
};

describe('parseURL', function () {
    for (var url in tests) {
        (function (url) {
            it('should parse ' + url + ' correctly', function () {
                assert.deepEqual(parseURL(url), tests[url]);
            });
        })(url);
    }
});
