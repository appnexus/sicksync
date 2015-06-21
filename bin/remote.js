#! /usr/bin/env node

/**
 *  Bootstrapper for remote-daemon.js
 *
 *  Triggered by first run of sicksync client, through ssh connection
 *  This file should only run on your devbox, (IE, in the data center).
 *  
 */

 console.log('starting daemon');

var forever = require('forever'),
    daemonFilePath = './sicksync-dev/lib/remote-daemon.js';

// TODO: change these files paths, right now they output to user's home location on remote server
// due to the fact that the process.cwd() is /home/cdopuch
var daemon = forever.startDaemon(
    daemonFilePath,
    {
        // NOTE: these log files are truncated on each new run
        // TODO: rotate the logs so we can save old logs
        'logFile': 'new-remote-daemon.log',
        'outFile': 'new-remote-daemon-stdout.log',
        'errFile': 'new-remote-daemon-stderr.log',
        'max': 1,
        'uid': 'remote-daemon'
    }
);
var server = forever.startServer(daemon);

// process.stdout.write('[remote.js] up and waiting');
console.log('[remote.js] up and waiting');