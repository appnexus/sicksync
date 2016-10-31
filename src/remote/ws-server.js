import { Server as WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import Crypt from '../crypt';
import text from '../../conf/text';
import { WS as WSEvents } from '../../conf/events';

const wsEvents = WSEvents.REMOTE;

export class WSServer extends EventEmitter {
  constructor(params) {
    super();

    this._secret = params.secret;
    this._encrypt = params.encrypt;
    this._crypt = new Crypt(this._secret);

    this._ws = new WebSocketServer({
      port: params.port,
    });

    this._ws.on('connection', this.handleConnect.bind(this));

    console.info(this._secret, text.SERVER_ON_READY);
  }

  handleConnect(ws) {
    ws.on('message', this.handleMessage.bind(this));
    ws.on('close', this.connectionClosed.bind(this));
  }

  handleMessage(message) {
    const parsedMessage = this._crypt.decryptAndParse(message, this._encrypt);

    if (parsedMessage.secret !== this._secret) {
      return this.emit(wsEvents.UNAUTHORIZED);
    }

    /* istanbul ignore else */
    if (parsedMessage.subject === 'file') {
      return this.emit(wsEvents.FILE_CHANGE, parsedMessage);
    }
  }

  connectionClosed() {
    this.emit(wsEvents.CONNECTION_CLOSED);
  }
}
