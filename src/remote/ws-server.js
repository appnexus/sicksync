var WebSocketServer = require('ws').Server,
    EventEmitter = require('events').EventEmitter,
    Crypt = require('../crypt'),
    text = require('../../conf/text'),
    wsEvents = require('../../conf/events').WS.REMOTE;

class WSServer extends EventEmitter {
    constructor (params) {
        super();

        this._secret = params.secret;
        this._encrypt = params.encrypt;
        this._crypt = new Crypt(this._secret);

        new WebSocketServer({ 
            port: params.port 
        }).on('connection', this.handleConnect.bind(this));

        console.log(this._secret, text.SERVER_ON_READY);
    }

    handleConnect (ws) {
        ws.on('message', this.handleMessage.bind(this));
        ws.on('close', this.connectionClosed.bind(this));
    }

    handleMessage (message) {
        var parsedMessage = this._crypt.decryptAndParse(message, this._encrypt);

        if (parsedMessage.secret !== this._secret) {
            return this.emit(wsEvents.UNAUTHORIZED);
        }

        /* istanbul ignore else */
        if (parsedMessage.subject === 'file') {
            return this.emit(wsEvents.FILE_CHANGE, parsedMessage);
        }
    }

    connectionClosed () {
        this.emit(wsEvents.CONNECTION_CLOSED);
    }
}

module.exports = WSServer;
