var _ = require('lodash'),
    fs = require('fs'),
    watcher = require('chokidar').watch,
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    constants = require('../../conf/constants');

function FSHelper() {
    this._config = util.getConfig();
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
    function onFileChange(evt, filepath) {
        if (this._paused || util.isExcluded(filepath.replace(this._config.sourceLocation, ''), this._config.excludes)) return;
        var fileContents = null;
        var fullDestinationPath = filepath.replace(this._config.sourceLocation, this._config.destinationLocation);

        if (evt === 'add' || evt === 'change') fileContents = fs.readFileSync(filepath).toString();

        this.emit('file-change', {
            subject: 'file',
            changeType: evt,
            filepath: fullDestinationPath,
            contents: fileContents
        });
    }

    watcher(this._config.sourceLocation, {
            ignored: this._config.excludes,
            persistent: true,
            followSymlinks: this._config.followSymlinks,
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
