const http = require('http');
const assert = require('assert');
const { request } = require('../lib/request');

describe('request', () => {
    describe('#request', () => {
        let server;
        let serveFunc;

        beforeEach(() => {
            serveFunc = function (req, res) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write('{"success":true}');
                res.end();
            };

            server = http.createServer((req, res) => serveFunc(req, res));
            server.listen(10111);
        });

        afterEach(done => {
            server.close(() => done());
        });

        it('completes a valid request', () => {
            return request('http://127.0.0.1:10111/').then(res => {
                assert.strictEqual(res.statusCode, 200);
                assert.strictEqual(res.data, '{"success":true}');
            });
        });

        it('rejects responses when a size limit is set', () => {
            serveFunc = (req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(Buffer.alloc(200 * 1024));
                res.end();
            };

            return request('http://127.0.0.1:10111/', {
                maxResponseSize: 100*1024
            }).then(() => {
                throw new Error('Expected failure due to response size');
            }).catch(error => {
                assert.strictEqual(
                    error.message,
                    'Response size limit exceeded'
                );
            });
        });

        it('times out', () => {
            serveFunc = (req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write('{"success":true}');

                setTimeout(() => res.end(), 100);
            };

            return request('http://127.0.0.1:10111/', { timeout: 1 }).then(() => {
                throw new Error('Expected failure due to request timeout');
            }).catch(error => {
                assert.strictEqual(
                    error.message,
                    'Request timed out'
                );
                assert.strictEqual(error.code, 'ETIMEDOUT');
            });
        });

        it('rejects URLs with non-http(s) protocols', () => {
            return request('ftp://127.0.0.1:10111/').then(() => {
                throw new Error('Expected failure due to unacceptable URL protocol');
            }).catch(error => {
                assert.strictEqual(
                    error.message,
                    'Unacceptable protocol "ftp:"'
                );
            });
        });

        it('rejects invalid URLs', () => {
            return request('not valid').then(() => {
                throw new Error('Expected failure due to invalid URL');
            }).catch(error => {
                assert.strictEqual(
                    error.message,
                    'Invalid URL'
                );
            });
        });
    });
});
