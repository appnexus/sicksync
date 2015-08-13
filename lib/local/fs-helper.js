var _ = require('lodash'),
    fs = require('fs'),
    watcher = require('chokidar').watch,
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    constants = require('../../conf/constants');

function FSHelper(params) {
    this._sourceLocation = params.sourceLocation;
    this._excludes = params.excludes || [];
    this._followSymLinks = params.followSymlinks || false;

    this._paused = false;
}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.pauseWatch = function() {
    this._paused = true;
};

FSHelper.prototype.unpauseWatch = function() {
    this._paused = false;
};

FSHelper.prototype.start = function() {
    function onFileChange(evt, sourcepath) {
        if (this._paused || util.isExcluded(sourcepath.replace(this._sourceLocation, ''), this._excludes)) return;
        var fileContents = null;

        if (evt === 'add' || evt === 'change') fileContents = fs.readFileSync(sourcepath).toString();

        this.emit('file-change', {
            subject: 'file',
            changeType: evt,
            sourcepath: sourcepath,
            contents: fileContents
        });
    }

    watcher(this._sourceLocation, {
            ignored: this._excludes,
            persistent: true,
            followSymlinks: this._followSymlinks,
            ignoreInitial: true
        })
        .on('all', util.rebounce(
            onFileChange.bind(this),
            _.partial(this.emit, 'large-change'),
            constants.NUM_FILES_FOR_RSYNC,
            constants.FILE_CHANGE_COOLDOWN_MS
        ));
};

module.exports = FSHelper;
