var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    crypt = require('./crypt'),
    isAuthorized = false,
    _ws = null,
    events = null,
    wss = null,
    port = null,
    secret = null;

function WSServer(params) {
    port = params.port;
    secret = params.secret;
    setupEventEmitter();
    setupServer();

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
    events.emit('ready');
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
    if (message.secret === secret) {
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

    // If we've received a message that isn't recognized
    events.emit('unauthorized');
}

function connectionClosed() {
    events.emit('connection-closed');
}

module.exports = WSServer;
