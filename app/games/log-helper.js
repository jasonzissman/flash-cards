'use strict';
let bunyan = require('bunyan');

let logger = bunyan.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    name: 'flash-cards',
    streams: [
        {
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'server.log',
            period: '1d',
            count: 14
        }]
});

module.exports = logger;