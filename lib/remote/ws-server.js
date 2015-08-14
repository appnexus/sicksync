var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    Crypt = require('../crypt'),
    text = require('../../conf/text'),
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
    console.log(secret, text.SERVER_ON_READY);

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

    /* istanbul ignore else */
    if (parsedMessage.subject === 'file') {
        return events.emit('file-change', parsedMessage);
    }
}

function connectionClosed() {
    events.emit('connection-closed');
}

module.exports = WSServer;
