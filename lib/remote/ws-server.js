var _ = require('lodash'),
    WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    Crypt = require('./crypt'),
    events = new EventEmitter(),
    _ws = null,
    wss = null,
    secret = null,
    encrypt = null,
    crypt = null;

function WSServer(params) {
    secret = params.secret;
    encrypt = params.encrypt;
    crypt = new Crypt(secret);

    wss = new WebSocketServer({ port: params.port });
    wss.on('connection', handleConnect);
    util.log('Server is ready');

    return {
        on: events.on.bind(events)
    };
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
