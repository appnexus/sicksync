var _ = require('lodash'),
    latestVersion = require('latest-version'),
    clc = require('cli-color'),
    fs = require('fs-extra'),
    exec = require('child_process').exec,
    hostname = require('os').hostname(),
    util = require('./util'),
    package = require('../package.json'),
    constants = require('../conf/constants'),
    config = util.getConfig(),
    now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            version: package.version
        };

module.exports = {
    getLatestVersion: _.partial(latestVersion, 'sicksync'),
    update: function() {
        var updateRemoteOnce = _.once(_.partial(stdin.write, constants.UPDATE_CMD + '\n'));
        var ssh = util.shellIntoRemote();

        // Update devbox
        ssh.stdout.on('data', function(data) {
            var message = data.toString();

            if (_.contains(message, 'sicksync@')) {
                console.log([
                    clc.green(config.hostname + ' updated successfully!')
                ].join('\n'));

                return ssh.kill('SIGINT');
            }

            if (_.contains(message, 'ERR!')) {
                console.log([
                    clc.red(config.hostname + ' update failed: ' + message),
                    'Please run `' + constants.UPDATE_CMD + '` on ' + config.hostname
                ].join('\n'));

                return ssh.kill('SIGINT');
            }

            updateRemoteOnce(ssh.stdin);
        });

        // Update local
        exec(constants.UPDATE_CMD, function (error, stdout, stderr) {
            if (!!error || !!stderr) {
                return console.log([
                    clc.red('There was a problem updating sicksync: ' + (error || stderr)),
                    'Please run `' + constants.UPDATE_CMD + '`'
                ].join('\n'));
            }

            console.log([
                clc.green(hostname + ' updated successfully!')
            ].join('\n'));
        });
    },
    notifyUpdates: function() {
        if (updateInfo.version !== package.version) {
            return console.log([
                clc.green('Sicksync update available!'),
                'Current version: ' + clc.yellow(package.version),
                'Latest version: ' + clc.green(updateInfo.version),
                'Run `' + clc.green('sicksync update') + '` to update!'
            ].join('\n'));
        }
    },
    checkForUpdates: function() {
        if (now - updateInfo.lastChecked >= constants.UPDATE_INTERVAL) {
            getLatestVersion(function (err, version) {
                if (err) return;
                fs.writeFileSync(
                    util.getUpdatePath(), 
                    JSON.stringify({
                        version: version,
                        lastChecked: now
                    })
                );
            });
        }
    }
};
