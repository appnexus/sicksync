var WebSocket = require('ws'),
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    crypt = require('./crypt'),
    config = util.getConfig(),
    bigSync = require('./big-sync'),
    events = null,
    ws = null,
    hostUrl = null;

function WSClient(params) {
    hostUrl = params.url;
    events = new EventEmitter();
    connect();

    return {
        send: send,
        on: events.on.bind(events)
    };
}

function send(obj) {
    ws.send(crypt.stringifyAndEncrypt(obj));
}

function handleConnect() {
    send({
        subject: 'handshake',
        token: config.secret
    });
}

function handleMessage(message) {
    var parsedMessage = crypt.decryptAndParse(message);

    if (parsedMessage.subject === 'handshake' && parsedMessage.isAllowed) {
        events.emit('authorized');
    }
}

function handleDisconnect() {
    var message = [
        config.hostname.yellow + ' closed the connection. Shutting down.'
    ].join('\n');

    console.log(message);

    if (config.retryOnDisconnect) {
        return handleError();
    }

    process.exit();
}

function handleError() {
    var message = [
        'Starting syncer with ' + config.hostname.yellow
    ].join('\n');
    bigSync();

    console.log(message);

    util.wakeDevBox(config.hostname, connect);
}

function connect() {
    ws = new WebSocket(hostUrl);
    ws.on('open', handleConnect);
    ws.on('message', handleMessage);
    ws.on('close', handleDisconnect);
    ws.on('error', handleError);
}

module.exports = WSClient;
