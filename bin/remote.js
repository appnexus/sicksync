#! /usr/bin/env node

/**
 *  SERVER
 *
 *  This file should only run on your devbox, (IE, in the data center).
 *  If you are planning on remotely working (shelling into the box), then
 *  you shouldn't need this file at all
 */
var fs = require('fs-extra'),
    Server = require('../lib/ws-server'),
    util = require('../lib/util'),
    config = util.getConfig(),
    destinationLocation = config.destinationLocation,
    server = new Server({
        port: config.websocketPort
    });

require('colors');

function addFile(message) {
    fs.outputFile(destinationLocation + message.location, message.contents);
}

function addDir(message) {
    fs.mkdirs(destinationLocation + message.location);
}

function removePath(message) {
    fs.delete(destinationLocation + message.location);
}

server.on('file-change', function(message) {
    if (config.debug) console.log('[' + config.hostname + '] < ' + message.changeType + ' ' + message.location);

    switch (message.changeType) {
        case 'add':
            addFile(message);
            break;
        case 'addDir':
            addDir(message);
            break;
        case 'change':
            addFile(message);
            break;
        case 'unlink':
            removePath(message);
            break;
        case 'unlinkDir':
            removePath(message);
            break;
        default:
            break;
    }
});
