#! /usr/bin/env node

/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var fs = require('fs'),
    chokidar = require('chokidar'),
    path = require('path'),
    util = require('../lib/util'),
    WebSocketClient = require('../lib/ws-client'),
    bigSync = require('../lib/big-sync'),
    config = util.getConfig(),
    ignored = config.excludes,
    devbox = null,
    watcher = null;

require('colors');

var NUM_FILES_FOR_LARGE_SEND = 3;
var FILE_CHANGE_COOLDOWN_TIME = 20;

var rebouncedFileChange = util.rebounce(onFileChange, onBigTransfer, NUM_FILES_FOR_LARGE_SEND, FILE_CHANGE_COOLDOWN_TIME);

function onBigTransfer() {
    if (config.debug) console.log('[local] Sending large change');
    
    stopFileWatch();
    bigSync(onBigTransferDone);
}

function onBigTransferDone() {
    if (config.debug) {
        console.log('['+ config.hostname +'] Received large change');
        startFileWatch();
    }
}

function filterAndRebounce(evt, filepath) {
    var relativePath = filepath.replace(config.sourceLocation, '');

    if (util.isExcluded(relativePath, ignored)) return false;

    rebouncedFileChange(evt, filepath);
}

function onFileChange(evt, filepath) {
    if (util.isExcluded(filepath, ignored))  return false;
    var fileContents = null;
    var localPath = filepath.replace(config.sourceLocation, '');

    if (evt === 'add' || evt === 'change') {
        fileContents = fs.readFileSync(filepath).toString();
    }

    if (config.debug) {
        console.log('[local] > ' + evt + ' ' + localPath);
    }

    devbox.send({
        subject: 'file',
        changeType: evt,
        location: localPath,
        contents: fileContents ? fileContents : null,
        name: path.basename(filepath)
    });
}

function startFileWatch() {
    watcher = chokidar.watch(config.sourceLocation, {
        ignored: ignored,
        persistent: true,
        followSymlinks: false,
        ignoreInitial: true
    }).on('all', filterAndRebounce);
}

function stopFileWatch() {
    watcher.close();
}

function onAuthorized() {
    console.log('Bringing', config.hostname, 'up to date...');

    bigSync(function() {
        console.log(('Connected to ' + config.hostname + (config.prefersEncrypted ? ' using' : ' not using') + ' encryption').green);
        startFileWatch();
    });
}

devbox = new WebSocketClient({
    url: 'ws://' + config.hostname + ':' + config.websocketPort
});

devbox.on('authorized', onAuthorized);
