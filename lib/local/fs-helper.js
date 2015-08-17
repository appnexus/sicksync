var _ = require('lodash'),
    fs = require('fs'),
    watcher = require('chokidar').watch,
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    path = require('path'),
    untildify = require('untildify'),
    util = require('../util'),
    constants = require('../../conf/constants'),
    eventsConf = require('../../conf/events'),
    fsEvents = eventsConf.FS.LOCAL;

function onFileChange(evt, sourcepath) {
    var relativepath = sourcepath.split(this._baseDir)[1],
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

function FSHelper(params) {
    this._sourceLocation = params.sourceLocation;
    this._excludes = params.excludes || [];
    this._followSymLinks = params.followSymlinks || false;
    this._baseDir = path.parse(this._sourceLocation).base + '/';
    this._paused = true;

    // Node/watcher only work with full file-paths (no ~'s)
    this._watcher = watcher(untildify(this._sourceLocation), {
            ignored: this._excludes,
            persistent: true,
            followSymlinks: this._followSymlinks,
            ignoreInitial: true
        })
        .on('all', util.rebounce(
            onFileChange.bind(this),
            _.partial(this.emit, fsEvents.LARGE),
            constants.NUM_FILES_FOR_RSYNC,
            constants.FILE_CHANGE_COOLDOWN_MS
        ));
}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.pauseWatch = function() {
    this._paused = true;
};

FSHelper.prototype.watch = function() {
    this._paused = false;
};

module.exports = FSHelper;
