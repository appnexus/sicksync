import _ from 'lodash';
import chalk from 'chalk';
import fs from 'fs-extra';

import { shellIntoRemote, getConfigPath } from './util';
import packageJson from '../package.json';

const configShape = {
  version: {
    type: 'String',
    func: _.isString,
  },
  debug: {
    type: 'Boolean',
    func: _.isBoolean,
  },
  retryOnDisconnect: {
    type: 'Boolean',
    func: _.isBoolean,
  },
  projects: {
    type: 'Array',
    func: _.isArray,
  },
};

const projectShape = {
  hostname: {
    type: 'String',
    func: _.isString,
  },
  username: {
    type: 'String',
    func: _.isString,
  },
  sourceLocation: {
    type: 'String',
    func: _.isString,
  },
  destinationLocation: {
    type: 'String',
    func: _.isString,
  },
  excludes: {
    type: 'Array',
    func: _.isArray,
  },
  prefersEncrypted: {
    type: 'Boolean',
    func: _.isBoolean,
  },
  websocketPort: {
    type: 'String',
    func: _.isString,
  },
  followSymLinks: {
    type: 'Boolean',
    func: _.isBoolean,
  },
  project: {
    type: 'String',
    func: _.isString,
  },
};

function logTimeout(username, host) {
  console.info(chalk.red(`Timed out waiting to connect to ${host} with user ${username}`));
  console.info(`Check to make sure your machine is reachable by by sshing: ${username}@${host}`);
}

export function canShellIntoHost({ username, hostname }) {
  return new Promise((resolve, reject) => {
    const ssh = shellIntoRemote(`${username}@${hostname}`);

    const timeoutId = setTimeout(() => {
      logTimeout(username, hostname);
      ssh.kill();
      reject(false);
    }, 10000);

    ssh.stdout.on('data', () => {
      clearTimeout(timeoutId);
      console.info(chalk.green(`Successfully connected to ${hostname} with user ${username}!`));
      ssh.kill();
      resolve(true);
    });
  }) ;
}

export function hasSicksyncRemote({ username, hostname }) {
  return new Promise((resolve, reject) => {
    const ssh = shellIntoRemote(`${username}@${hostname}`);

    const timeoutId = setTimeout(() => {
      clearAndKill();
      logTimeout(username, hostname);
      reject(false);
    }, 10000);

    const clearAndKill = () => {
      ssh.kill();
      clearTimeout(timeoutId);
    };

        // See if we can find sicksync
    ssh.stdin.write('which sicksync\n');

    ssh.stdout.on('data', (data) => {
      const message = data.toString();

      if (_.includes(message, 'no sicksync in')) {
        clearAndKill();
        console.info(chalk.red(`Couldn't start sicksync on ${hostname} with user ${username}!`));
        console.info(`Check to ensure it's installed globally on ${hostname}: 'npm i -g sicksync'`);
        console.info(`Lastly, check to make sure your .bashrc or .zshrc contains the npm global path.`);
        reject(false);
      }

      if (_.includes(message, '/sicksync')) {
        clearAndKill();
        console.info(chalk.green(`Successfully found sicksync on host ${hostname} with user ${username}!`));
        resolve(true);
      }
    });
  });
}

export function hasRightSicksyncVerions({ hostname, username }) {
  return new Promise((resolve, reject) => {
    const ssh = shellIntoRemote(`${username}@${hostname}`);

    const timeoutId = setTimeout(() => {
      clearAndKill();
      logTimeout(username, hostname);
      reject(false);
    }, 10000);

    const clearAndKill = () => {
      ssh.kill();
      clearTimeout(timeoutId);
    };

        // See if sicksync is at the right version
    ssh.stdin.write('sicksync -V\n');

    ssh.stdout.on('data', (data) => {
      const message = data.toString();

      if (message.match(/^(\d+\.)?(\d+\.)?(\d+\.*)/g)) {
        const version = message.trim();
        clearAndKill();

        if (version !== packageJson.version) {
          console.info(chalk.red(hostname, 'is at version', version, 'but is locally at version', packageJson.version));
          console.info('Please make sure both machines are at the latest verions');
          reject(false);
        } else {
          console.info(chalk.green(hostname, 'has same version of sicksync!'));
          resolve(true);
        }
      }
    });
  });
}

export function hasConfig() {
  return new Promise((resolve, reject) => {
    const configPath = getConfigPath();

    fs.stat(configPath, (err/*, stats */) => {
      if (err) {
        console.info(chalk.red(`sicksync couldn't find a config file!`));
        console.info(`Be sure it's located at "~/.sicksync/config.json"`);
        console.info(`Or add a new project with "sicksync add-project" to create one`);
        reject(false);
      } else {
        console.info(chalk.green(`Found the sicksync config file!`));
        resolve(true);
      }
    });
  });
}

export function configHasRightShape(config) {
  return new Promise((resolve, reject) => {
    const hasRightShape = _.every(configShape, ({ func, type }, key) => {
      if (_.isUndefined(config[key])) {
        console.info(chalk.red(`Config is missing:`, key));
        console.info('Please make sure your config has a', key, 'property');
        return false;
      }

      if (!func(config[key])) {
        console.info(chalk.red(`Config`, key, `has the wrong type!`));
        console.info('Please make sure your', key, 'has type', type);
        return false;
      }

      return true;
    });

    if (hasRightShape) {
      console.info(chalk.green(`sicksync's config has all the right properties and looks good!`));
      resolve(true);
    } else {
      reject(false);
    }
  });
}

export function projectHasRightShape(project) {
  return new Promise((resolve, reject) => {
    const projectName = project.project;

    const hasRightShape = _.every(projectShape, ({ func, type }, key) => {
      if (_.isUndefined(project[key])) {
        console.info(chalk.red(`Project is missing:`, key));
        console.info('Please make sure your project has a', key, 'property');
        return false;
      }

      if (!func(project[key])) {
        console.info(chalk.red(projectName, key, `has the wrong type!`));
        console.info('Please make sure', projectName,  key, 'has type', type);
        return false;
      }

      return true;
    });

    if (hasRightShape) {
      console.info(chalk.green(project.project, `has all the right properties and looks good!`));
      resolve(true);
    } else {
      reject(false);
    }
  });
}

export function checkAll(config) {
  console.info(chalk.yellow('* Checking if config is present...'));

  hasConfig()
    .then(() => {
      console.info(chalk.yellow('\n* Checking config file...'));
      return configHasRightShape(config);
    })
    .then(() => {
      console.info(chalk.yellow('\n* Checking projects in config file...'));

      return Promise.all(_.map(config.projects, projectHasRightShape));
    })
    .then(() => {
      console.info(chalk.yellow('\n* Checking host for each project'));

      return Promise.all(_.map(config.projects, canShellIntoHost));
    })
    .then(() => {
      console.info(chalk.yellow('\n* Checking sicksync on hosts for each project'));

      return Promise.all(_.map(config.projects, hasSicksyncRemote));
    })
    .then(() => {
      console.info(chalk.yellow('\n* Checking sicksync version on hosts for each project'));

      return Promise.all(_.map(config.projects, hasRightSicksyncVerions));
    })
    .then(() => {
      console.info(chalk.green('\nEverything looks good!'));
    });
}
