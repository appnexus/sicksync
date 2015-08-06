var WebSocket = require('ws'),
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    Crypt = require('./crypt'),
    config = util.getConfig(),
    crypt = null,
    events = null,
    ws = null,
    hostUrl = null;

function WSClient(params) {
    hostUrl = params.url;
    crypt = new Crypt(config.secret);
    events = new EventEmitter();
    connect();

    return {
        send: send,
        on: events.on.bind(events)
    };
}

function send(obj) {
    obj.secret = config.secret;
    ws.send(crypt.stringifyAndEncrypt(obj));
}

function handleConnect() {
    events.emit('ready');
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

    util.wakeDevBox(connect);
}

function connect() {
    ws = new WebSocket(hostUrl);
    ws.on('open', handleConnect);
    ws.on('close', handleDisconnect);
    ws.on('error', reconnect);
}

module.exports = WSClient;
