const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

const ytdlbin = process.env.MQ_YTDL || 'yt-dlp';
const ffprbin = process.env.MQ_FFPR || 'ffprobe';

/*
 * Retrieves video data from a youtube-dl supported source
 *
 * Returns a JSON object
 *
 */
export async function ytdl(url) {
    const command = {
        bin: ytdlbin,
        par: '-j',
    };

    try {
        const link = new URL(url);
        const { stdout } = await execFile(command.bin, [command.par, link.href]);
        const info = JSON.parse(stdout);
        return info;
    } catch(err) {
        if(err?.message?.match(/404|not found/i)){
            throw new Error('Media not found');
        }
        throw new Error('An unexpected error occurred.');
    }
}

export async function getDuration(url) {
    // Just need the duration
    const params = [
        '-loglevel', 'error',
        '-show_entries', 'format=duration',
        '-print_format', 'default=noprint_wrappers=1:nokey=1'
    ];

    try {
        const stdout = await ffprobe({ params, url });
        const duration = Math.floor(stdout);
        return duration;
    } catch(err) {
        throw err;
    }
}

async function ffprobe({ params = null, url }) {
    const command = {
        bin: ffprbin,
        par: [
            '-loglevel', 'error',
            '-show_entries', 'stream:format',
            '-print_format', 'json=compact=1',
        ],
    };

    try {
        const link = new URL(url);
        const { stdout } = await execFile(command.bin, [...(params || command.par), link.href]);
        return stdout
    } catch(err) {
        throw err;
    }
}
