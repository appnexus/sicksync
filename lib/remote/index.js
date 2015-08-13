var _ = require('lodash'),
    fsHelper = require('./fs-helper'),
    Server = require('./ws-server'),
    chalk = require('chalk');

module.exports = function startRemote(opts) {
    if (!_.isNumber(opts.port)) return console.warn(chalk.red('--port, -p, is required. See `sicksync remote -h`'));
    if (!_.isString(opts.secret)) return console.warn(chalk.red('--secret, -s, is required. See `sicksync remote -h`'));
    var log = _.partial(console.log.bind(console), opts.secret);

    var server = new Server({
        port: opts.port,
        secret: opts.secret,
        debug: opts.debug,
        encrypt: opts.encrypt
    });

    server.on('unauthorized', function() {
        log('unauthorized connection, stopping server');
        process.exit();
    });

    server.on('connection-closed', function() {
        log('connection closed, stopping server');
        process.exit();
    });

    server.on('file-change', function(message) {
        if (opts.debug) log('<', message.changeType, message.filepath);

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
