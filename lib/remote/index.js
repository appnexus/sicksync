var _ = require('lodash'),
    FSHelper = require('./fs-helper'),
    Server = require('./ws-server'),
    text = require('../../conf/text'),
    eventsConf = require('../../conf/events'),
    fsEvents = eventsConf.FS.REMOTE,
    wsEvents = eventsConf.WS.REMOTE;

module.exports = function startRemote(opts) {
    if (!_.isNumber(opts.port)) return console.warn(text.REMOTE_MISSING_PORT);
    if (!_.isString(opts.secret)) return console.warn(text.REMOTE_MISSING_SECRET);

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
    wss.on(wsEvents.UNAUTHORIZED, function() {
        log(text.SERVER_ON_UNAUTHORIZED);
        process.exit();
    });

    wss.on(wsEvents.CONNECTION_CLOSED, function() {
        log(text.SERVER_ON_CONNECTION_CLOSED);
        process.exit();
    });

    wss.on(wsEvents.FILE_CHANGE, function(message) {
        log(message);
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
    fsHelper.on(fsEvents.ADD_FILE, receivedLog);
    fsHelper.on(fsEvents.ADD_DIR, receivedLog);
    fsHelper.on(fsEvents.DELETE, receivedLog);

    fsHelper.on(fsEvents.ADD_FILE_ERR, errorLog);
    fsHelper.on(fsEvents.ADD_DIR_ERROR, receivedLog);
    fsHelper.on(fsEvents.DELETE_ERROR, receivedLog);
};
