import _ from 'lodash';
import latestVersion from 'latest-version';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { hostname } from 'os';
import { basename } from 'path';
import untildify from 'untildify';
import util from './util';
import packageJson from '../package.json';
import constants from '../conf/constants';
import text from '../conf/text';

let now = Date.now(),
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            version: packageJson.version
        };

let getLatestVersion = _.partial(_.ary(latestVersion, 2), 'sicksync');

function updateRemote (project) {
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
}

function updateLocal () {
    exec(constants.UPDATE_CMD,  (error, stdout, stderr) => {
        if (!!error || _.contains(stderr, 'ERR!')) {
            return console.info(hostname, text.UPDATE_FAIL, (error || stderr));
        }

        console.info(hostname(), text.UPDATE_SUCCESS);
    });
}

function update (config, opts) {
    if (opts.check) {
        return getLatestVersion(function(err, version) {
            if (err) return;
            console.info('Latest Version:', version);
            console.info('Current Version:', packageJson.version);
        });
    }

    if (opts.migrateConfig) {
        return migrateConfig(config);
    }

    _.each(config.projects, updateRemote);

    updateLocal();
}

function notify () {
    if (updateInfo.version !== packageJson.version) {
        return console.info(
            text.UPDATE_AVAILABLE, '\n',
            'Current version:', packageJson.version, '\n',
            'Latest version:', updateInfo.version);
    }
}

function check () {
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

function migrate1to2(config) {
    if (_.isEmpty(config)) {
        let configLocation = untildify(constants.CONFIG_FILE_V1);
        config = require(configLocation);
        fs.delete(configLocation);
    }

    config.project = basename(config.sourceLocation);

    return {
        version: packageJson.version,
        debug: config.debug,
        retryOnDisconnect: config.retryOnDisconnect,
        projects: [
            _.chain(config)
                .omit('debug', 'retryOnDisconnect')
                .mapKeys(function(value, key) {
                    if (key === 'userName') return 'username';
                    return key;
                })
                .value()
        ]
    };
}

function migrateConfig(config) {
    let configVersion = config.version ? +configVersion.replace('.', '') : null;

    if (!configVersion) {
        util.writeConfig(migrate1to2(config));
    }
}

export default {
    migrate1to2,
    migrateConfig,
    update,
    notify,
    check,
    updateLocal,
    updateRemote,
    getLatestVersion
};
