import _ from 'lodash';
import fs from 'fs-extra';
import { exec, spawn } from 'child_process';
import minimatch from 'minimatch';
import chalk from 'chalk';
import path from 'path';
import untildify from 'untildify';
import constants from '../conf/constants';
import text from '../conf/text';

// Returns the path to the sicksync dir
export function getSicksyncDir() {
  return untildify(constants.SICKSYNC_DIR);
}

// Return the path to the update json
export function getUpdatePath() {
  return getSicksyncDir() + '/' + constants.UPDATE_FILE;
}

// Returns the path the the config file
export function getConfigPath() {
  return getSicksyncDir() + '/' + constants.CONFIG_FILE;
}

// Returns the config object if it exists, if not an empty object. Loads/saves from cache where possible
// TODO: `existsSync` is going to be deprecated soon...
export function getConfig() {
  const configPath = getConfigPath();
  let config = {};

  if (fs.existsSync(configPath)) {
    config = require(configPath);
  }

  // Return a cloned copy of config to avoid indirect changes
  return _.cloneDeep(config);
}

// Randomly generate a unique ID
export function getId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

// Write out the config file with a provided <obj>
export function writeConfig(configFile) {
  const configPath = getConfigPath();

  fs.outputFileSync(configPath, JSON.stringify(configFile, null, 4));
  console.info(text.CONFIG_SAVED);
}

// Given a file path, check to see if it's in the excludes array
export function isExcluded(filepath, excludes) {
  let result = false;

  excludes.forEach(function(exclude) {
    if (minimatch(filepath, exclude)) result = true;
  });

  return result;
}

// Log messages with Hostname prepended
export function generateLog(projectName, hostname) {
  const args = _.slice(arguments);

  // If only one argument it's the hostname
  if (args.length === 1) {
    projectName = null;
    hostname = args[0];
  }

  return function log() {
    const args = [
      projectName ? chalk.blue('[' + projectName + ']') : '',
      hostname ? chalk.green('[' + hostname + ']') : '',
    ].concat([].slice.call(arguments));

    console.info.apply(console, args);
  };
}

//
// Rebounce
//
// Takes a desired function, a fallback function, the number of times
// called, and a cool down. Returns a `rebounced` function.
//
// The basic idea is that we want to limit calls to function to a
// certain # of times in a given time-frame. If it breaks over that,
// then we fallback to another function, and halt previous desired calls
export function rebounce(primaryFn, secondaryFn, fallOverAmount, coolDown) {
  const timeOutIds = [];
  let timesCalled = 0;
  let fallbackCalled = false;

  return function rebounced() {
    const args = arguments;
    timesCalled++;

    timeOutIds.push(setTimeout(function() {
      timesCalled = 0;
      primaryFn.apply(null, args);
    }, coolDown));

    if (timesCalled >= fallOverAmount) {
      timeOutIds.forEach(clearTimeout);

      /* istanbul ignore else */
      if (!fallbackCalled) {
        timesCalled = 0;
        fallbackCalled = true;
        secondaryFn.apply(null, arguments);
        setTimeout(function() {
          fallbackCalled = false;
        }, coolDown);
      }
    }
  };
}

export function ensureTrailingSlash(path) {
  return (path.substring(path.length - 1) === '/') ? path : path + '/';
}

export function open(parameter) {
  return exec('open ' + parameter);
}

export function toBoolean(param) {
  const lowerParam = param.toLowerCase();

  if (lowerParam.indexOf('y') > -1) {
    return true;
  }

  if (lowerParam.indexOf('n') > -1) {
    return false;
  }

  if (lowerParam === 'true' || lowerParam === 'false') {
    return JSON.parse(lowerParam);
  }

  return false;
}

export function setupPrompter(prompt) {
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();

  return prompt;
}

export function shellIntoRemote(remote) {
  return spawn('ssh', [
    '-tt',
    remote,
  ]);
}

export function printLogo() {
  console.info(chalk.blue(fs.readFileSync(path.resolve(__dirname, '../conf/logo.txt')).toString()));
}

export function uniqInstance(tokenPath, Constructor) {
  const instances = {};

  return function(args) {
    const token = _.get(args, tokenPath, null);

    if (_.get(instances, token, null)) {
      return instances[token];
    }

    if (!_.isNull(token)) {
      instances[token] = new Constructor(args);
      return instances[token];
    }

    return new Constructor(args);
  };
}

export function getProjectFromCwd(config) {
  return _.chain(config.projects)
    .filter((project) => {
      return _.isEqual(
        ensureTrailingSlash(untildify(project.sourceLocation)),
        ensureTrailingSlash(process.cwd())
      );
    })
    .value();
}

export function getProjectsFromConfig(config, projects) {
  let foundProjects = [];

  if (_.isEmpty(projects)) {
    const cwdProject = getProjectFromCwd(config);

    if (cwdProject) {
      foundProjects = cwdProject;
    }
  }

  _.each(projects, (project) => {
    const projectConf = _.find(config.projects, { project });

    if (!_.isEmpty(projectConf)) {
      foundProjects.push(projectConf);
    }
  });

  return foundProjects;
}
