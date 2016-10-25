import _ from 'lodash';
import FSHelper from './fs-helper';
import Server from './ws-server';
import text from '../../conf/text';
import eventsConf from '../../conf/events';

const fsEvents = eventsConf.FS.REMOTE;
const wsEvents = eventsConf.WS.REMOTE;

export function startRemote(opts) {
  if (!_.isNumber(opts.port)) return console.info(text.REMOTE_MISSING_PORT);
  if (!_.isString(opts.secret)) return console.info(text.REMOTE_MISSING_SECRET);

  const log = _.partial(console.info.bind(console), opts.secret);
  const receivedLog = _.partial(log, '<');
  const errorLog = _.partial(log, 'ERR');

  const wss = new Server({
    port: opts.port,
    secret: opts.secret,
    debug: opts.debug,
    encrypt: opts.encrypt,
  });

  const fsHelper = new FSHelper();

    // WS events
  wss.on(wsEvents.UNAUTHORIZED, () => {
    log(text.SERVER_ON_UNAUTHORIZED);
    process.exit();
  });

  wss.on(wsEvents.CONNECTION_CLOSED, () => {
    log(text.SERVER_ON_CONNECTION_CLOSED);
    process.exit();
  });

  wss.on(wsEvents.FILE_CHANGE, (message) => {
    switch (message.changeType) {
      case 'add':
        fsHelper.addFile(message);
        break;
      case 'addDir':
        fsHelper.addDir(message);
        break;
      case 'change':
        fsHelper.addFile(message);
        break;
      case 'unlink':
        fsHelper.removePath(message);
        break;
      case 'unlinkDir':
        fsHelper.removePath(message);
        break;
      default:
        break;
    }
  });

    // FS Events
  fsHelper.on(fsEvents.ADD_FILE, receivedLog);
  fsHelper.on(fsEvents.ADD_DIR, receivedLog);
  fsHelper.on(fsEvents.DELETE, receivedLog);

  fsHelper.on(fsEvents.ADD_FILE_ERROR, errorLog);
  fsHelper.on(fsEvents.ADD_DIR_ERROR, errorLog);
  fsHelper.on(fsEvents.DELETE_ERROR, errorLog);
}
