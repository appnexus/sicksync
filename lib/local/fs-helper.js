var _ = require('lodash'),
    fs = require('fs'),
    watcher = require('chokidar').watch,
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    constants = require('../../conf/constants'),
    events = new EventEmitter(),
    config = util.getConfig(),
    ignored = config.excludes,
    isPaused = false,
    fswatcher = null;

function pauseWatch() {
    isPaused = true;
}

function unpauseWatch() {
    isPaused = false;
}

function onFileChange(evt, filepath) {
    if (isPaused || util.isExcluded(filepath.replace(config.sourceLocation, ''), ignored)) return;
    var fileContents = null;
    var fullDestinationPath = filepath.replace(config.sourceLocation, config.destinationLocation);

    if (evt === 'add' || evt === 'change') fileContents = fs.readFileSync(filepath).toString();

    events.emit('file-change', {
        subject: 'file',
        changeType: evt,
        filepath: fullDestinationPath,
        contents: fileContents
    });
}

function start() {
    if (fswatcher) fswatcher.close();

    fswatcher = watcher(config.sourceLocation, {
            ignored: ignored,
            persistent: true,
            followSymlinks: config.followSymlinks,
            ignoreInitial: true
        })
        .on('all', util.rebounce(
            onFileChange,
            _.partial(events.emit, 'large-change'),
            constants.NUM_FILES_FOR_RSYNC,
            constants.FILE_CHANGE_COOLDOWN_MS
        ));
}

module.exports = {
    pauseWatch: pauseWatch,
    unpauseWatch: unpauseWatch,
    on: events.on.bind(events),
    once: events.once.bind(events),
    start: start
};
