// https://en.wikipedia.org/wiki/ISO_8601#Durations
const DURATION_SCALE = [
    [/(\d+)D/, 24*3600],
    [/(\d+)H/, 3600],
    [/(\d+)M/, 60],
    [/(\d+)S/, 1]
];

/*
 * Parse an ISO 8601 time duration (the format used by YouTube).
 * In the interest of sanity, only days, hours, minutes, and seconds are
 * considered.
 */
export function parseDuration(duration) {
    let time = 0;
    for (let [regex, scale] of DURATION_SCALE) {
        let m;
        if (m = duration.match(regex)) {
            time += parseInt(m[1]) * scale;
        }
    }

    return time;
};
