import fs from 'fs-extra';
import { EventEmitter } from 'events';
import untildify from 'untildify';
import { FS } from '../../conf/events';

const fsEvents = FS.REMOTE;

class FSHelper extends EventEmitter {

  constructor() {
    super();
  }

  addFile(message) {
    fs.outputFile(untildify(message.destinationpath), message.contents, (err) => {
      if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);

      this.emit(fsEvents.ADD_FILE, message.destinationpath);
    });
  }

  addDir(message) {
    fs.mkdirs(untildify(message.destinationpath), (err) => {
      if (err) return this.emit(fsEvents.ADD_DIR_ERROR, err);

      this.emit(fsEvents.ADD_DIR, message.destinationpath);
    });
  }

  removePath(message) {
    fs.delete(untildify(message.destinationpath), (err) => {
      if (err) return this.emit(fsEvents.DELETE_ERROR, err);

      this.emit(fsEvents.DELETE, message.destinationpath);
    });
  }
}

export default FSHelper;
