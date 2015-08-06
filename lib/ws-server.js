var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    Crypt = require('./crypt'),
    _ws = null,
    events = null,
    wss = null,
    port = null,
    secret = null,
    encrypt = null,
    crypt = null;

function WSServer(params) {
    port = params.port;
    secret = params.secret;
    encrypt = params.encrypt;
    crypt = new Crypt(secret);
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

function handleMessage(message) {
    var parsedMessage = crypt.decryptAndParse(message, encrypt);

    if (parsedMessage.secret !== secret) {
        return events.emit('unauthorized');
    }

    if (parsedMessage.subject === 'file') {
        return events.emit('file-change', parsedMessage);
    }
}

function connectionClosed() {
    events.emit('connection-closed');
}

module.exports = WSServer;
