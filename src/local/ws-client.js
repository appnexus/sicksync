import _ from 'lodash';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import RemoteHelper from './remote-helper';

import CryptHelper from '../crypt';
import eventsConf from '../../conf/events';

const wsEvents = eventsConf.WS.LOCAL;
const remoteEvents = eventsConf.REMOTE;

class WSClient extends EventEmitter {
  constructor(params) {
    super();

    this._secret = params.secret;
    this._prefersEncrypted = params.prefersEncrypted;
    this._crypt = new CryptHelper(this._secret);
    this._retryOnDisconnect = params.retryOnDisconnect;
    this._hostname = params.hostname;
    this._webSocketPort = params.websocketPort;
    this._username = params.username;
    this._devbox = new RemoteHelper({
      secret: this._secret,
      websocketPort: this._webSocketPort,
      username: this._username,
      hostname: this._hostname,
      prefersEncrypted: this._prefersEncrypted,
      debug: this._debug,
    });

    this._connect();
  }

  _connect() {
    this._ws = new WebSocket('ws://' + this._hostname + ':' + this._webSocketPort);
    this._ws.on('open', _.partial(this.emit.bind(this), wsEvents.READY));
    this._ws.on('close', this._handleDisconnect.bind(this));
    this._ws.on('error', this._reconnect.bind(this));
  }

  _handleDisconnect() {
    if (this._retryOnDisconnect) {
      return this._reconnect();
    }
    this.emit(wsEvents.DISCONNECTED);
  }

  _reconnect() {
    this.emit('reconnecting');

    this._devbox.start();
    this._devbox.on(remoteEvents.READY, this._connect.bind(this));
    this._devbox.on(remoteEvents.MESSAGE, _.partial(this.emit.bind(this), wsEvents.REMOTE_MESSAGE));
    this._devbox.on(remoteEvents.NOT_FOUND, _.partial(this.emit.bind(this), wsEvents.REMOTE_NOT_FOUND));
  }

  send(obj) {
    obj.secret = this._secret;
    this._ws.send(this._crypt.stringifyAndEncrypt(obj, this._prefersEncrypted));
  }
}

export default WSClient;
