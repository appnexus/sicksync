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
    server = null;

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

module.exports = function startRemote(cmd)) {
    server = new Server({
        port: config.websocketPort,
        secret: cmd.secret,
        debug: cmd.debug
    });

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
}
