var _ = require('lodash'),
    FSHelper = require('./fs-helper'),
    Server = require('./ws-server'),
    chalk = require('chalk'),
    text = require('../../conf/text');

module.exports = function startRemote(opts) {
    if (!_.isNumber(opts.port)) return console.warn(chalk.red('--port, -p, is required. See `sicksync remote -h`'));
    if (!_.isString(opts.secret)) return console.warn(chalk.red('--secret, -s, is required. See `sicksync remote -h`'));
    var log = _.partial(console.log.bind(console), opts.secret);
    var receivedLog = _.partial(log, '<');
    var errorLog = _.partial(log, 'ERR');

    var wss = new Server({
        port: opts.port,
        secret: opts.secret,
        debug: opts.debug,
        encrypt: opts.encrypt
    });

    var fsHelper = new FSHelper();

    // WS events
    wss.on('unauthorized', function() {
        log(text.SERVER_ON_UNAUTHORIZED);
        process.exit();
    });

    wss.on('connection-closed', function() {
        log(text.SERVER_ON_CONNECTION_CLOSED);
        process.exit();
    });

    wss.on('file-change', function(message) {
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

    // FS Events
    fsHelper.on('add-file', receivedLog);
    fsHelper.on('add-dir', receivedLog);
    fsHelper.on('delete', receivedLog);

    fsHelper.on('add-file-error', errorLog);
    fsHelper.on('add-dir-error', errorLog);
    fsHelper.on('delete-error', errorLog);
};
