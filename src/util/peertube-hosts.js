import fs from 'fs';
import path from 'path';
import { getJSON } from '../request';

const url = {
    host:  'https://instances.joinpeertube.org',
    path:  '/api/v1/instances',
    query: '?start=0&count=1000&sort=-totalLocalVideos'
}

getJSON(`${url.host}${url.path}${url.query}`).then(result => {
    const hostlist = result.data.map(peer => peer.host);
    fs.writeFileSync(path.resolve(__dirname, 'peers.json'), JSON.stringify(hostlist));
});
