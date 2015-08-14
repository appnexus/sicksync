var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    nodeUtil = require('util'),
    Crypt = require('../crypt'),
    text = require('../../conf/text');

function WSServer(params) {
    this._secret = params.secret;
    this._encrypt = params.encrypt;
    this._crypt = new Crypt(this._secret);

    new WebSocketServer({ 
        port: params.port 
    }).on('connection', this.handleConnect.bind(this));

    console.log(this._secret, text.SERVER_ON_READY);
}

nodeUtil.inherits(WSServer, EventEmitter);

WSServer.prototype.handleConnect = function(ws) {
    this._ws = ws;
    ws.on('message', this.handleMessage.bind(this));
    ws.on('close', this.connectionClosed.bind(this));
};

WSServer.prototype.handleMessage = function(message) {
    var parsedMessage = this._crypt.decryptAndParse(message, this._encrypt);

    if (parsedMessage.secret !== this._secret) {
        return this.emit('unauthorized');
    }

    /* istanbul ignore else */
    if (parsedMessage.subject === 'file') {
        return this.emit('file-change', parsedMessage);
    }
};

WSServer.prototype.connectionClosed = function() {
    this.emit('connection-closed');
};

module.exports = WSServer;
