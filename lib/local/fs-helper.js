var fs = require('fs'),
    watcher = require('chokidar'),
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    events = new EventEmitter(),
    config = util.getConfig(),
    ignored = config.excludes,
    isPaused = false,
    fswatcher = null;

var NUM_FILES_FOR_LARGE_SEND = 10;
var FILE_CHANGE_COOLDOWN_TIME = 10;

var rebouncedFileChange = util.rebounce(onFileChange, onBigTransfer, NUM_FILES_FOR_LARGE_SEND, FILE_CHANGE_COOLDOWN_TIME);

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
