#! /usr/bin/env node

/**
 *  SERVER
 *
 *  This file should only run on your devbox, (IE, in the data center).
 *  If you are planning on remotely working (shelling into the box), then
 *  you shouldn't need this file at all
 */
var fs = require('fs-extra'),
    sys = require('sys'),
    Server = require('../lib/ws-server'),
    util = require('../lib/util'),
    config = util.getConfig(),
    destinationLocation = config.destinationLocation,
    server = new Server({
        port: config.websocketPort
    });

require('colors');

function serverLog(message) {
    var prefix = '[' + config.hostname + '] ';
    sys.puts(prefix + message);
}

function addFile(message) {
    console.log(destinationLocation[message.destinationIndex] + message.location);
    fs.outputFile(destinationLocation[message.destinationIndex] + message.location, message.contents);
}

function addDir(message) {
    console.log(destinationLocation[message.destinationIndex] + message.location);
    fs.mkdirs(destinationLocation[message.destinationIndex] + message.location);
}

function removePath(message) {
    console.log(destinationLocation[message.destinationIndex] + message.location);
    fs.delete(destinationLocation[message.destinationIndex] + message.location);
}

server.on('file-change', function(message) {
    if (config.debug) serverLog('< ' + message.changeType + ' ' + message.location);

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

server.on('connection-closed', function() {
    serverLog('Connection closed. Stopping server.');
    process.exit();
});
