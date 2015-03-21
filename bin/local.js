#! /usr/bin/env node

/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var fs = require('fs'),
    watcher = require('chokidar'),
    path = require('path'),
    util = require('../lib/util'),
    WebSocketClient = require('../lib/ws-client'),
    bigSync = require('../lib/big-sync'),
    config = util.getConfig(),
    ignored = config.excludes,
    isPaused = false,
    devbox = null,
    sourceLocation = config.sourceLocation;

require('colors');

var NUM_FILES_FOR_LARGE_SEND = 10;
var FILE_CHANGE_COOLDOWN_TIME = 10;

var rebouncedFileChange = util.rebounce(onFileChange, onBigTransfer, NUM_FILES_FOR_LARGE_SEND, FILE_CHANGE_COOLDOWN_TIME);

function onBigTransfer() {
    if (config.debug) console.log('[local] Sending large change');

    bigSync(onBigTransferDone);
    isPaused = true;
}

function onBigTransferDone() {
    if (config.debug) {
        console.log('['+ config.hostname +'] Received large change');
    }
    isPaused = false;
}

function filterAndRebounce(evt, filepath) {
    var sourceIndex = findSourceLocation(filepath);

    if (!isFinite(sourceIndex)) throw new Error('No matching source location was found for the file ' + filepath);

    // console.log('Source index: ' + sourceIndex);

    var relativePath = filepath.replace(sourceLocation[sourceIndex], '');
    
    if (util.isExcluded(relativePath, ignored) || util.isExcluded(filepath, ignored) || isPaused) return false;
    
    rebouncedFileChange(evt, filepath, sourceIndex);
}

// returns the index of the first sourceLocation that is a substring of the filepath
function findSourceLocation(filepath) {
    for (var i = 0, len = sourceLocation.length; i < len; i++) {
        if (filepath.search(sourceLocation[i]) !== -1) {
            return i;
        }
    }
}

function onFileChange(evt, filepath, sourceIndex) {
    var fileContents = null;
    var localPath = filepath.replace(sourceLocation[sourceIndex], '');

    if (evt === 'add' || evt === 'change') {
        fileContents = fs.readFileSync(filepath).toString();
    }

    if (config.debug) {
        console.log('[local] > ' + evt + ' ' + localPath);
    }

    console.log('Client file path ' + filepath);
    console.log('Local file path ' + localPath);

    devbox.send({
        subject: 'file',
        changeType: evt,
        location: localPath,
        contents: fileContents ? fileContents : null,
        name: path.basename(filepath),
        destinationIndex: sourceIndex
    });
}

function startFileWatch() {
    watcher.watch(config.sourceLocation, {
        ignored: ignored,
        persistent: true,
        ignoreInitial: true
    }).on('all', filterAndRebounce);
}

function onAuthorized() {
    startFileWatch();
    console.log(('Connected to ' + config.hostname + (config.prefersEncrypted ? ' using' : ' not using') + ' encryption').green);
}

devbox = new WebSocketClient({
    url: 'ws://' + config.hostname + ':' + config.websocketPort
});

devbox.on('authorized', onAuthorized);
