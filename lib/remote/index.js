var _ = require('lodash'),
    fsHelper = require('./fs-helper'),
    Server = require('./ws-server'),
    util = require('../util'),
    chalk = require('chalk');

module.exports = function startRemote(opts) {
    if (!_.isNumber(opts.port)) return console.warn(chalk.red('--port, -p, is required. See `sicksync remote -h`'));
    if (!_.isString(opts.secret)) return console.warn(chalk.red('--secret, -s, is required. See `sicksync remote -h`'));

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
