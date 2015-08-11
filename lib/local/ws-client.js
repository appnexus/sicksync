var _ = require('lodash'),
    WebSocket = require('ws'),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    RemoteHelper = require('./remote-helper'),
    util = require('../util'),
    Crypt = require('../crypt');

function WSClient(params) {
    this._config = util.getConfig();
    this._crypt = new Crypt(this._config.secret);
    this._hostUrl = params.url;
    this._connect();
}

nodeUtil.inherits(WSClient, EventEmitter);

WSClient.prototype.send = function(obj) {
    obj.secret = this._config.secret;
    this._ws.send(this._crypt.stringifyAndEncrypt(obj, this._config.prefersEncrypted));
};

WSClient.prototype._connect = function() {
    this._ws = new WebSocket(this._hostUrl);
    this._ws.on('open', _.partial(this.emit.bind(this), 'ready'));
    this._ws.on('close', this._handleDisconnect.bind(this));
    this._ws.on('error', this._reconnect.bind(this));
};

WSClient.prototype._handleDisconnect = function() {
    this.emit('disconnected');

    if (this._config.retryOnDisconnect) {
        return this._reconnect();
    }

    process.exit();
};

WSClient.prototype._reconnect = function() {
    var devbox = new RemoteHelper();
    this.emit('reconnecting');

    devbox.start();
    devbox.on('ready', this._connect.bind(this));
    devbox.on('message', console.log.bind(console));
};

module.exports = WSClient;
