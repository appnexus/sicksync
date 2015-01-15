var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    crypt = require('./crypt'),
    config = util.getConfig(),
    isAuthorized = false,
    _ws = null,
    events = null,
    wss = null,
    port = null;

function WSServer(params) {
    port = params.port;
    setupServer();
    setupEventEmitter();

    return {
        on: events.on.bind(events)
    };
}

function setupEventEmitter() {
    events = new EventEmitter();
}

function setupServer() {
    wss = new WebSocketServer({
        port: port
    });
    wss.on('connection', handleConnect);
    console.log('[' + config.hostname + '] Server is up and waiting for changes');
}

function handleConnect(ws) {
    _ws = ws;
    ws.on('message', handleMessage);
    ws.on('close', connectionClosed);
}

function send(obj) {
    _ws.send(crypt.stringifyAndEncrypt(obj));
}

function handshake(message) {
    if (message.token === config.secret) {
        isAuthorized = true;

        send({
            subject: 'handshake',
            isAllowed: isAuthorized
        });

    } else {
        _ws.close();
    }
}

function handleFileChange(message) {
    events.emit('file-change', message);
}

function handleMessage(message) {
    var parsedMessage = crypt.decryptAndParse(message);

    if (parsedMessage.subject === 'handshake') {
        return handshake(parsedMessage);
    }

    if (isAuthorized && parsedMessage.subject === 'file') {
        return handleFileChange(parsedMessage);
    }

    // If we've received a message that isn't recognized, bail
    console.log('Server is closing');
    process.exit();
}

function connectionClosed() {
    events.emit('connection-closed');
}

module.exports = WSServer;
