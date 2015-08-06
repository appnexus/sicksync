/**
 *  SERVER
 *
 *  This file should only run on your devbox, (IE, in the data center).
 *  If you are planning on remotely working (shelling into the box), then
 *  you shouldn't need this file at all
 */
var fs = require('fs-extra'),
    Server = require('./ws-server'),
    util = require('../util'),
    server = null;

function addFile(message) {
    fs.outputFile(message.filepath, message.contents);
}

function addDir(message) {
    fs.mkdirs(message.filepath);
}

function removePath(message) {
    fs.delete(message.filepath);
}

module.exports = function startRemote(cmd) {
    server = new Server({
        port: cmd.port,
        secret: cmd.secret,
        debug: cmd.debug,
        encrypt: cmd.encrypt
    });

    server.on('file-change', function(message) {
        if (cmd.debug) util.log('<', message.changeType, message.filepath);

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

    server.on('unauthorized', function() {
        util.log('Unauthorized connection. Stopping server.');
        process.exit();
    });

    server.on('connection-closed', function() {
        util.log('Connection closed. Stopping server.');
        process.exit();
    });
};
