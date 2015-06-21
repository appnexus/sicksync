console.log(" -- STARTING DAEMON SCRIPT -- ");
// console.error("ERROR: NOTHING IS WRONG");

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
    stayAlive = true, // starts true so that the server stays alive until a client connects
    server = new Server({
        port: config.websocketPort
    });

require('colors');

function serverLog(message) {
    var prefix = '[' + config.hostname + '] ';
    console.log(prefix + message);
}

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

server.on('connection-closed', function(clientCount) {
    stayAlive = clientCount > 0;
});

// keep the server alive as long as there are still client connections
// poll every 10 seconds -- while(stayAlive){} doesn't give the server time to accept connections
var delay = 10000;
setInterval(function(){
    console.log('[remote-daemon] stay alive: ' + stayAlive);
    if(!stayAlive) {
        console.log('[remote-daemon] no client connections remain, shutting down server');
        process.exit();  
    }
}, delay);

