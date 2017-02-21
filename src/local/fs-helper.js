import _ from 'lodash';
import fs from 'fs';
import os from 'os';
import { watch } from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';
import untildify from 'untildify';
import * as util from '../util';
import constants from '../../conf/constants';
import eventsConf from '../../conf/events';

const fsEvents = eventsConf.FS.LOCAL;

export class FSHelper extends EventEmitter {
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
      ignoreInitial: true,
    })
    .on('all', util.rebounce(
      this.onFileChange.bind(this),
      _.partial(this.emit, fsEvents.LARGE),
      constants.NUM_FILES_FOR_RSYNC,
      constants.FILE_CHANGE_COOLDOWN_MS
    ));
  }

  onFileChange(evt, sourcepath) {
    if (os.platform() === 'win32') {
      sourcepath = sourcepath.replace(/\\/g, '/');
    }

    let fileContents = null;

    if (this._paused || util.isExcluded(sourcepath, this._excludes)) return;
    if (evt === 'add' || evt === 'change') {
      try {
        fileContents = fs.readFileSync(sourcepath).toString();
      } catch (err) {
        console.warn(`WARNING: Couldn't sync file.`, err.message);
      }
    }

    this.emit(fsEvents.CHANGE, {
      sourcepath,
      changeType: evt,
      contents: fileContents,
    });
  }

  pauseWatch() {
    this._paused = true;
  }

  watch() {
    this._paused = false;
  }
}
