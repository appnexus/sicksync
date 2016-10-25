import _ from 'lodash';
import latestVersion from 'latest-version';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { hostname } from 'os';
import { basename } from 'path';
import untildify from 'untildify';
import * as util from './util';
import { version as currentVersion } from '../package.json';
import constants from '../conf/constants';
import text from '../conf/text';

const now = Date.now();
const updateInfo = fs.existsSync(util.getUpdatePath()) ?
  require(util.getUpdatePath()) : {
    lastChecked: 0,
    version: currentVersion,
  };

export const getLatestVersion = _.partial(_.ary(latestVersion, 2), 'sicksync');

export function updateRemote(project) {
  const ssh = util.shellIntoRemote(project.username + '@' + project.hostname);

  const updateRemoteOnce = _.once(function(stdin) {
    stdin.write(constants.UPDATE_CMD + '\n');
  });

    // Update devbox
  ssh.stdout.on('data', (data) => {
    const message = data.toString();

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

export function updateLocal() {
  exec(constants.UPDATE_CMD,  (error, stdout, stderr) => {
    if (!!error || _.contains(stderr, 'ERR!')) {
      return console.info(hostname, text.UPDATE_FAIL, (error || stderr));
    }

    console.info(hostname(), text.UPDATE_SUCCESS);
  });
}

export function update(config, opts) {
  if (opts.check) {
    return getLatestVersion(function(err, version) {
      if (err) return;
      console.info(
        text.UPDATE_AVAILABLE, '\n',
        'Current version:', currentVersion, '\n',
        'Latest version:', version
      );
    });
  }

  if (opts.migrateConfig) {
    return migrateConfig(config);
  }

  _.each(config.projects, updateRemote);

  updateLocal();
}

export function notify() {
  if (updateInfo.version !== currentVersion) {
    return console.info(
      text.UPDATE_AVAILABLE, '\n',
      'Current version:', currentVersion, '\n',
      'Latest version:', updateInfo.version
    );
  }
}

export function check() {
  if (now - updateInfo.lastChecked >= constants.UPDATE_INTERVAL) {
    getLatestVersion(function(err, version) {
      if (err) return;
      fs.writeFileSync(
        util.getUpdatePath(),
        JSON.stringify({
          version: version,
          lastChecked: now,
        })
      );
    });
  }
}

export function migrate1to2(config) {
  if (_.isEmpty(config)) {
    const configLocation = untildify(constants.CONFIG_FILE_V1);
    config = require(configLocation);
    fs.delete(configLocation);
  }

  config.project = basename(config.sourceLocation);

  return {
    version: currentVersion,
    debug: config.debug,
    retryOnDisconnect: config.retryOnDisconnect,
    projects: [
      _.chain(config)
        .omit('debug', 'retryOnDisconnect')
        .mapKeys(function(value, key) {
          if (key === 'userName') return 'username';
          return key;
        })
        .value(),
    ],
  };
}

export function migrateConfig(config) {
  const configVersion = config.version ?
    config.version.replace(/\./g, '') :
    null;

  if (!configVersion) {
    util.writeConfig(migrate1to2(config));
  }
}
