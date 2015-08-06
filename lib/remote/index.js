var fsHelper = require('./fs-helpr'),
    Server = require('./ws-server'),
    util = require('../util');

module.exports = function startRemote(opts) {
    var server = new Server({
        port: opts.port,
        secret: opts.secret,
        debug: opts.debug,
        encrypt: opts.encrypt
    });

    server.on('unauthorized', function() {
        util.log('unauthorized connection, stopping server');
        process.exit();
    });

    server.on('connection-closed', function() {
        util.log('connection closed, stopping server');
        process.exit();
    });

    server.on('file-change', function(message) {
        if (opts.debug) util.log('<', message.changeType, message.filepath);

        switch (message.changeType) {
            case 'add':
                fsHelper.addFile(message);
                break;
            case 'addDir':
                fsHelper.addDir(message);
                break;
            case 'change':
                fsHelper.addFile(message);
                break;
            case 'unlink':
                fsHelper.removePath(message);
                break;
            case 'unlinkDir':
                fsHelper.removePath(message);
                break;
            default:
                break;
        }
    });
};
