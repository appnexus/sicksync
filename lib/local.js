/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var fs = require('fs'),
    watcher = require('chokidar'),
    util = require('../lib/util'),
    WebSocketClient = require('../lib/ws-client'),
    bigSync = require('../lib/big-sync'),
    config = util.getConfig(),
    ignored = config.excludes,
    isPaused = false,
    devbox = null,
    fswatcher = null;

var NUM_FILES_FOR_LARGE_SEND = 10;
var FILE_CHANGE_COOLDOWN_TIME = 10;

var rebouncedFileChange = util.rebounce(onFileChange, onBigTransfer, NUM_FILES_FOR_LARGE_SEND, FILE_CHANGE_COOLDOWN_TIME);

function onBigTransfer() {
    isPaused = true;
    if (config.debug) util.log('Sending large change...');

    bigSync(function() {
        isPaused = false;
        if (config.debug) util.log('Large change sent!');
    });
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

    if (config.debug) util.log('>', evt, filepath);

    devbox.send({
        subject: 'file',
        changeType: evt,
        filepath: fullDestinationPath,
        contents: fileContents
    });
}

function startFileWatch() {
    if (fswatcher) fswatcher.close();

    fswatcher = watcher.watch(config.sourceLocation, {
        ignored: ignored,
        persistent: true,
        followSymlinks: config.followSymlinks,
        ignoreInitial: true
    }).on('all', filterAndRebounce);
}

function onAuthorized() {
    util.log('Bringing', config.hostname, 'up to date...');

    bigSync(function() {
        util.log('Connected to ', config.hostname, (config.prefersEncrypted ? ' using' : ' not using'), ' encryption');
        startFileWatch();
    });
}

function onReconnect() {
    util.log('Reconnecting to', config.hostname);
}

function onDisconnected() {
    util.log(config.hostname, 'disconnected');
}

module.exports = function startLocal(/* cmd */) {
    devbox = new WebSocketClient({
        url: 'ws://' + config.hostname + ':' + config.websocketPort
    });

    devbox.on('authorized', onAuthorized);
    devbox.on('reconnecting', onReconnect);
    devbox.on('disconnected', onDisconnected);
};
