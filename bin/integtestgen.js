var fs = require('fs');
var path = require('path');

var apiKeys = require('../keys.json');
var mediaquery = require('../index');
mediaquery.setAPIKeys(apiKeys);

var url = process.argv[2];
var opts = {};
if (process.argv[3]) {
    opts = JSON.parse(process.argv[3]);
}

mediaquery.lookup(url, opts).then(function (media) {
    var dest = path.resolve(__dirname, '..', 'test_data',
            media.type + '_' + media.id.replace(/[\/:]/g, '_') + '.json');
    fs.writeFileSync(dest, JSON.stringify(media, null, 2));
    console.log('Wrote ' + dest);
    process.exit(0);
}).catch(function (err) {
    console.error(err.stack);
    process.exit(1);
});
