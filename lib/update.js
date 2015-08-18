var _ = require('lodash'),
    latestVersion = require('latest-version'),
    fs = require('fs-extra'),
    exec = require('child_process').exec,
    hostname = require('os').hostname(),
    util = require('./util'),
    package = require('../package.json'),
    constants = require('../conf/constants'),
    text = require('../conf/text'),
    now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            version: package.version
        };

module.exports = {
    getLatestVersion: _.partial(latestVersion, 'sicksync'),
    updateRemote: function(project) {
        var ssh = util.shellIntoRemote(project.username + '@' + project.hostname);

        var updateRemoteOnce = _.once(function(stdin){
            stdin.write(constants.UPDATE_CMD + '\n');
        });

        // Update devbox
        ssh.stdout.on('data', function(data) {
            var message = data.toString();

            if (_.contains(message, 'sicksync@')) {
                console.log(project.hostname, text.UPDATE_SUCCESS);

                return ssh.kill('SIGINT');
            }

            if (_.contains(message, 'ERR!')) {
                console.log(project.hostname, text.UPDATE_FAIL);

                return ssh.kill('SIGINT');
            }

            updateRemoteOnce(ssh.stdin);
        });
    },
    updateLocal: function() {
        exec(constants.UPDATE_CMD, function (error, stdout, stderr) {
            if (!!error || _.contains(stderr, 'ERR!')) {
                return console.log(hostname, text.UPDATE_FAIL, (error || stderr));
            }

            console.log(hostname, text.UPDATE_SUCCESS);
        });
    },
    update: function(config, cmd) {
        if (cmd.check) {
            return this.getLatestVersion(function(err, version) {
                if (err) return;
                console.log('Latest Version:', version);
                console.log('Current Version:', package.version);
            });
        }

        _.each(config.projects, this.updateRemote);

        this.updateLocal();
    },
    notify: function() {
        if (updateInfo.version !== package.version) {
            return console.log(
                text.UPDATE_AVAILABLE, '\n',
                'Current version:', package.version, '\n',
                'Latest version:', updateInfo.version);
        }
    },
    check: function() {
        if (now - updateInfo.lastChecked >= constants.UPDATE_INTERVAL) {
            this.getLatestVersion(function (err, version) {
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
