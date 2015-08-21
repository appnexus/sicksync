import _ from 'lodash';
import latestVersion from 'latest-version';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { hostname as getHostname } from 'os';
import util from './util';
import packageJson from '../package.json';
import constants from '../conf/constants';
import text from '../conf/text';

let now = Date.now(),
    hostname = getHostname(),
    console = console,
    updateInfo = fs.existsSync(util.getUpdatePath()) ?
        require(util.getUpdatePath()) :
        {
            lastChecked: now,
            version: packageJson.version
        };

export default {
    getLatestVersion: _.partial(latestVersion, 'sicksync'),
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
    }
};
