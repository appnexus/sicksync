let _ = require('lodash'),
    latestVersion = require('latest-version'),
    fs = require('fs-extra'),
    exec = require('child_process').exec,
    hostname = require('os').hostname(),
    util = require('./util'),
    packageJson = require('../package.json'),
    constants = require('../conf/constants'),
    text = require('../conf/text'),
    now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            version: packageJson.version
        };

module.exports = {
    getLatestVersion: _.partial(_.ary(latestVersion, 2), 'sicksync'),
    updateRemote (project) {
        let ssh = util.shellIntoRemote(project.username + '@' + project.hostname);

        let updateRemoteOnce = _.once(function(stdin){
            stdin.write(constants.UPDATE_CMD + '\n');
        });

        // Update devbox
        ssh.stdout.on('data', function(data) {
            let message = data.toString();

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
    updateLocal () {
        exec(constants.UPDATE_CMD, function (error, stdout, stderr) {
            if (!!error || _.contains(stderr, 'ERR!')) {
                return console.log(hostname, text.UPDATE_FAIL, (error || stderr));
            }

            console.log(hostname, text.UPDATE_SUCCESS);
        });
    },
    update (config, cmd) {
        if (cmd.check) {
            return this.getLatestVersion(function(err, version) {
                console.log('wat');
                if (err) return;
                console.log('Latest Version:', version);
                console.log('Current Version:', packageJson.version);
            });
        }

        _.each(config.projects, this.updateRemote);

        this.updateLocal();
    },
    notify () {
        if (updateInfo.version !== packageJson.version) {
            return console.log(
                text.UPDATE_AVAILABLE, '\n',
                'Current version:', packageJson.version, '\n',
                'Latest version:', updateInfo.version);
        }
    },
    check () {
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
    },
    migrateConfig(config) {
        let updatedConfig = {};
        let configVersion = (config.version) ? config.version : '1.2.0';
        configVersion = +configVersion.replace('.', '');

        if (configVersion <= 120) {
            let projectName = paths.basename(project.sourceLocation);
            updatedConfig.debug = config.debug;
            updatedConfig.retryOnDisconnect = config.retryOnDisconnect;
            updatedConfig.projects = [{
                project: projectName,
                hostname: config.hostname,
                username: config.username,
                sourceLocation: config.sourceLocation,
                destinationLocation: config.destinationLocation,
                excludes: config.excludes,
                websocketPort: config.websocketPort,
                followSymLinks: config.followSymLinks,
                prefersEncrypted: config.prefersEncrypted
            }];
        }
    }
};
