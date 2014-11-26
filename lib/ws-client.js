var WebSocket = require('ws'),
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    crypt = require('./crypt'),
    config = require(util.getConfigPath()),
    events = null,
    ws = null,
    hostUrl = null;

function WSClient(params) {
    params = params || {};
    hostUrl = params.url;
    events = new EventEmitter();
    connect();
    process.on('SIGINT', handleSigint);

    return {
        send: send,
        on: events.on.bind(events)
    };
}

function send(obj) {
    ws.send(crypt.stringifyAndEncrypt(obj));
}

function handleSigint() {
    send({ subject: 'close' });
    process.exit();
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

    console.log(message.yellow);
    process.exit();
}

function onServerWakeUp() {
    connect();
}

function handleError() {
    var message = [
        'Starting syncer with ' + config.hostname
    ].join('\n');

    console.log(message.yellow);

    util.wakeDevBox(config.hostname, onServerWakeUp);
}

function connect() {
    ws = new WebSocket(hostUrl);
    ws.on('open', handleConnect);
    ws.on('message', handleMessage);
    ws.on('close', handleDisconnect);
    ws.on('error', handleError);
}

module.exports = WSClient;