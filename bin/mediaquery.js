var mediaquery = require('../index');

var url = process.argv[2];
var data = mediaquery.parseUrl(url);
if (data === null) {
    console.error('Unrecognized URL: ' + url);
    process.exit(1);
}

mediaquery.lookup(data).then(function (media) {
    console.log(JSON.stringify(media, null, 4));
    process.exit(0);
}).catch(function (err) {
    console.error(err);
    process.exit(1);
});
