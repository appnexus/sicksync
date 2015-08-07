var _ = require('lodash'),
    latestVersion = require('latest-version'),
    clc = require('cli-color'),
    fs = require('fs-extra'),
    exec = require('child_process').exec,
    hostname = require('os').hostname(),
    util = require('./util'),
    package = require('../package.json'),
    config = util.getConfig(),
    now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            hasNewerVersion: false
        };

var UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 24; // Check once a day
var SICKSYNC_UPDATE_CMD = 'npm i -g sicksync';

function writeUpdateFile(info) {
    fs.writeFile(util.getUpdatePath(), JSON.stringify(info));
}

function sendUpdateSignal(stdin) {
    stdin.write(SICKSYNC_UPDATE_CMD + '\n');
}

function setUpdateFlag(flag) {
    writeUpdateFile({
        lastChecked: now,
        hasNewerVersion: flag
    });
}

module.exports = {
    update: function() {
        var updateRemoteOnce = _.once(sendUpdateSignal);
        var ssh = util.shellIntoRemote();

        // Update devbox
        ssh.stdout.on('data', function(data) {
            var message = data.toString();

            if (_.contains(message, 'sicksync@')) {
                console.log([
                    clc.green(config.hostname + ' updated successfully!')
                ].join('\n'));

                return ssh.kill('SIGINT');
            };

            if (_.contains(message, 'ERR!')) {
                console.log([
                    clc.red(config.hostname + ' update failed: ' + message),
                    'Please run `' + SICKSYNC_UPDATE_CMD + '` on ' + config.hostname
                ].join('\n'));

                return ssh.kill('SIGINT');
            }

            updateRemoteOnce(ssh.stdin);
        });

        // Update local
        exec(SICKSYNC_UPDATE_CMD, function (error, stdout, stderr) {
            if (!!error || !!stderr) {
                return console.log([
                    clc.red('There was a problem updating sicksync: ' + (error || stderr)),
                    'Please run `' + SICKSYNC_UPDATE_CMD + '`'
                ].join('\n'));
            }

            console.log([
                clc.green(hostname + ' updated successfully!')
            ].join('\n'))
            setUpdateFlag(false);
        });
    },
    notifyUpdates: function() {
        if (updateInfo.hasNewerVersion && updateInfo.status === 'ok') {
            console.log([
                clc.green('Sicksync update available!'),
                'Current version: ' + clc.yellow(package.version),
                'Latest version: ' + clc.green(updateInfo.latestVersion),
                'Run `' + clc.green('sicksync update') + '` to update!'
            ].join('\n'));
        }
    },
    checkForUpdates: function() {
        if (now - updateInfo.lastChecked < UPDATE_CHECK_INTERVAL) {
            return writeUpdateFile(updateInfo);
        }

        latestVersion('sicksync', function (err, version) {
            var results = {
                hasNewerVersion: false,
                lastChecked: now,
                status: err ? 'err' : 'ok'
            };

            if (version !== package.version) {
                results.hasNewerVersion = true;
                results.latestVersion = version;
            }

            writeUpdateFile(results);
        });
    }
};
