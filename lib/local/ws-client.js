var _ = require('lodash'),
    WebSocket = require('ws'),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    RemoteHelper = require('./remote-helper'),
    Crypt = require('../crypt');

function WSClient(params) {
    this._secret = params.secret;
    this._prefersEncrypted = params.prefersEncrypted;
    this._crypt = new Crypt(this._secret);
    this._retryOnDisconnect = params.retryOnDisconnect;
    this._hostname = params.hostname;
    this._webSocketPort = params.websocketPort;
    this._username = params.username;

    this._connect();
}

nodeUtil.inherits(WSClient, EventEmitter);

WSClient.prototype.send = function(obj) {
    obj.secret = this._secret;
    this._ws.send(this._crypt.stringifyAndEncrypt(obj, this._prefersEncrypted));
};

WSClient.prototype._connect = function() {
    this._ws = new WebSocket('ws://' + this._hostname + ':' + this._webSocketPort);
    this._ws.on('open', _.partial(this.emit.bind(this), 'ready'));
    this._ws.on('close', this._handleDisconnect.bind(this));
    this._ws.on('error', this._reconnect.bind(this));
};

WSClient.prototype._handleDisconnect = function() {
    this.emit('disconnected');

    if (this._retryOnDisconnect) {
        return this._reconnect();
    }

    process.exit();
};

WSClient.prototype._reconnect = function() {
    var devbox = new RemoteHelper({
        secret: this._secret,
        websocketPort: this._webSocketPort,
        remote: this._username + '@' + this._hostname,
        prefersEncrypted: this._prefersEncrypted,
        debug: this._debug
    });

    this.emit('reconnecting');

    devbox.start();
    devbox.on('ready', this._connect.bind(this));
    devbox.on('message', console.log.bind(console));
};

module.exports = WSClient;
