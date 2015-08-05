var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    crypt = require('./crypt'),
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

function handleMessage(message) {
    var parsedMessage = crypt.decryptAndParse(message);

    if (parsedMessage.secret !== config.secret) {
        return events.emit('unauthorized');
    }

    if (parsedMessage.subject === 'file') {
        return events.emit('file-change', message);
    }
}

function connectionClosed() {
    events.emit('connection-closed');
}

module.exports = WSServer;
