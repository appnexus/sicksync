import _ from 'lodash';
import fs from 'fs';
import os from 'os';
import { watch } from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';
import untildify from 'untildify';
import util from '../util';
import constants from '../../conf/constants';
import eventsConf from '../../conf/events';

let fsEvents = eventsConf.FS.LOCAL;

class FSHelper extends EventEmitter {
    constructor(params) {
        super();

        this._sourceLocation = untildify(params.sourceLocation);
        this._excludes = params.excludes || [];
        this._followSymLinks = params.followSymlinks || false;
        this._baseDir = path.parse(this._sourceLocation).base + '/';
        this._paused = true;

        // Node/watcher only work with full file-paths (no ~'s)
        this._watcher = watch(this._sourceLocation, {
                cwd: this._sourceLocation,
                ignored: this._excludes,
                persistent: true,
                followSymlinks: this._followSymlinks,
                ignoreInitial: true
            })
            .on('all', util.rebounce(
                this.onFileChange.bind(this),
                _.partial(this.emit, fsEvents.LARGE),
                constants.NUM_FILES_FOR_RSYNC,
                constants.FILE_CHANGE_COOLDOWN_MS
            ));
    }

    onFileChange (evt, sourcepath) {
        if (os.platform() === 'win32') {
            sourcepath = sourcepath.replace(/\\/g, '/');
        }

        let relativepath = sourcepath,
            localpath = this._sourceLocation + relativepath,
            fileContents = null;

        if (this._paused || util.isExcluded(relativepath, this._excludes)) return;
        if (evt === 'add' || evt === 'change') fileContents = fs.readFileSync(sourcepath).toString();

        this.emit(fsEvents.CHANGE, {
            changeType: evt,
            relativepath: relativepath,
            localpath: localpath,
            contents: fileContents
        });
    }

    pauseWatch () {
        this._paused = true;
    }

    watch () {
        this._paused = false;
    }
}

export default FSHelper;
