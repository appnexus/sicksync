let _ = require('lodash'),
    latestVersion = require('latest-version'),
    fs = require('fs-extra'),
    exec = require('child_process').exec,
    hostname = require('os').hostname(),
    path = require('path'),
    untildify = require('untildify'),
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
        ssh.stdout.on('data', (data) => {
            let message = data.toString();

            if (_.contains(message, 'sicksync@')) {
                console.info(project.hostname, text.UPDATE_SUCCESS);

                return ssh.kill('SIGINT');
            }

            if (_.contains(message, 'ERR!')) {
                console.info(project.hostname, text.UPDATE_FAIL);

                return ssh.kill('SIGINT');
            }

            updateRemoteOnce(ssh.stdin);
        });
    },
    updateLocal () {
        exec(constants.UPDATE_CMD,  (error, stdout, stderr) => {
            if (!!error || _.contains(stderr, 'ERR!')) {
                return console.info(hostname, text.UPDATE_FAIL, (error || stderr));
            }

            console.info(hostname, text.UPDATE_SUCCESS);
        });
    },
    update (config, opts) {
        if (opts.check) {
            return this.getLatestVersion(function(err, version) {
                if (err) return;
                console.info('Latest Version:', version);
                console.info('Current Version:', packageJson.version);
            });
        }

        if (opts.migrateConfig) {
            return this.migrateConfig(config);
        }

        _.each(config.projects, this.updateRemote);

        this.updateLocal();
    },
    notify () {
        if (updateInfo.version !== packageJson.version) {
            return console.info(
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
    migrate1to2(config) {
        if (_.isEmpty(config)) {
            let configLocation = untildify(constants.CONFIG_FILE_V1);
            config = require(configLocation);
            fs.delete(configLocation);
        }

        config.project = path.basename(config.sourceLocation);

        return {
            version: packageJson.version,
            debug: config.debug,
            retryOnDisconnect: config.retryOnDisconnect,
            projects: [_.omit(config, 'debug', 'retryOnDisconnect')]
        };
    },
    migrateConfig(config) {
        let configVersion = config.version ? +configVersion.replace('.', '') : null;

        if (!configVersion) {
            util.writeConfig(this.migrate1to2(config));
        }
    }
};
