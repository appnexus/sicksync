import fs from 'fs-extra';
import { EventEmitter } from 'events';
import untildify from 'untildify';
import eventsConf from '../../conf/events';

let fsEvents = eventsConf.FS.REMOTE;

class FSHelper extends EventEmitter {

    constructor() {
        super();
    }

    addFile (message) {
        fs.outputFile(untildify(message.destinationpath), message.contents, function(err) {
            if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);

            this.emit(fsEvents.ADD_FILE, message.destinationpath);
        }.bind(this));
    }

    addDir (message) {
        fs.mkdirs(untildify(message.destinationpath), function(err) {
            if (err) return this.emit(fsEvents.ADD_DIR_ERROR, err);

            this.emit(fsEvents.ADD_DIR, message.destinationpath);
        }.bind(this));
    }

    removePath (message) {
        fs.delete(untildify(message.destinationpath), function(err) {
            if (err) return this.emit(fsEvents.DELETE_ERROR, err);

            this.emit(fsEvents.DELETE, message.destinationpath);
        }.bind(this));
    }
}

export default FSHelper;
