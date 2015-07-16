var WebSocket = require('ws'),
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    crypt = require('./crypt'),
    config = util.getConfig(),
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
        secret: config.secret
    });
}

function handleMessage(message) {
    var parsedMessage = crypt.decryptAndParse(message);

    if (parsedMessage.subject === 'handshake' && parsedMessage.isAllowed) {
        events.emit('authorized');
    }
}

function handleDisconnect() {
    events.emit('disconnected');

    if (config.retryOnDisconnect) {
        return reconnect();
    }

    process.exit();
}

function reconnect() {
    events.emit('reconnecting');

    util.wakeDevBox(config.hostname, connect);
}

function connect() {
    ws = new WebSocket(hostUrl);
    ws.on('open', handleConnect);
    ws.on('message', handleMessage);
    ws.on('close', handleDisconnect);
    ws.on('error', reconnect);
}

module.exports = WSClient;
