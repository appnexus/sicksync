var latestVersion = require('latest-version'),
    clc = require('cli-color'),
    fs = require('fs-extra'),
    util = require('./util'),
    package = require('../package.json'),
    now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            hasNewerVersion: false
        };

var UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 24; // Check once a day

function writeUpdateFile(info) {
    fs.writeFile(util.getUpdatePath(), JSON.stringify(info));
}

function checkForUpdates() {
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

module.exports = {
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
    checkForUpdates: checkForUpdates
};
