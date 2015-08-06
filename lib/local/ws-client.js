var WebSocket = require('ws'),
    EventEmitter = require('events').EventEmitter,
    remoteHelper = require('./remote-helper'),
    util = require('../util'),
    Crypt = require('../crypt'),
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
    ws.send(crypt.stringifyAndEncrypt(obj, config.prefersEncrypted));
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
    var devbox = remoteHelper.start();
    events.emit('reconnecting');

    devbox.on('ready', connect);
    devbox.on('message', console.log.bind(console));
}

function connect() {
    ws = new WebSocket(hostUrl);
    ws.on('open', handleConnect);
    ws.on('close', handleDisconnect);
    ws.on('error', reconnect);
}

module.exports = WSClient;
