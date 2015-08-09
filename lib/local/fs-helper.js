var fs = require('fs'),
    watcher = require('chokidar'),
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    constants = require('../../conf/constants'),
    events = new EventEmitter(),
    config = util.getConfig(),
    ignored = config.excludes,
    isPaused = false,
    fswatcher = null;

var rebouncedFileChange = util.rebounce(
    onFileChange,
    onBigTransfer,
    constants.NUM_FILES_FOR_RSYNC,
    constants.FILE_CHANGE_COOLDOWN_MS
);

function onBigTransfer() {
    events.emit('large-change');
}

function filterAndRebounce(evt, filepath) {
    var relativePath = filepath.replace(config.sourceLocation, '');

    if (util.isExcluded(relativePath, ignored) || isPaused) return false;

    rebouncedFileChange(evt, filepath);
}

function onFileChange(evt, filepath) {
    if (util.isExcluded(filepath, ignored) || isPaused) return false;
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

    fswatcher = watcher.watch(config.sourceLocation, {
        ignored: ignored,
        persistent: true,
        followSymlinks: config.followSymlinks,
        ignoreInitial: true
    }).on('all', filterAndRebounce);
}

function pauseWatch() {
    isPaused = true;
}

function unpauseWatch() {
    isPaused = false;
}

module.exports = {
    pauseWatch: pauseWatch,
    unpauseWatch: unpauseWatch,
    on: events.on.bind(events),
    start: start
};
