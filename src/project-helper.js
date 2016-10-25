import _ from 'lodash';
import { sep } from 'path';
import prompter from 'prompt';
import { green, yellow } from 'chalk';
import { version } from '../package.json';
import * as util from './util';

const sicksyncSetup = util.setupPrompter(prompter);

function printProjectInfo(project) {
  console.info(green(project.project));
  _.forIn(project, (value, key) => {
    console.info('  ', yellow(_.startCase(key)), value);
  });
}

export const add = (config) => {
  const questions = {
    project: {
      description: 'What would you like to name this project?',
      required: true,
      default: _.last(process.cwd().split(sep)),
      message: 'Please enter a name for this project',
    },
    hostname: {
      description: 'What is the hostname or IP address of the machine you\'d like to sync this to?',
      required: true,
      message: 'Please enter a hostname or IP address',
    },
    username: {
      description: 'What is the username you use to shell into your remote machine?',
      required: true,
      default: process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME,
      message: 'Please enter a username.',
    },
    sourceLocation: {
      description: 'What is the absolute path of the directory you would like to sync from?',
      message: 'Please enter a valid path.',
      default: process.cwd(),
      required: true,
    },
    destinationLocation: {
      description: 'What is the absolute path of the directory you wish to sync to?',
      message: 'Please enter a valid path.',
      default: process.cwd(),
      required: true,
    },
    excludes: {
      description: 'Are there any files you\'d like to exclude? Use a comma separated list (supports globbing)',
      default: '.git/**,.git/**/*,.idea/*,**/*.swp,**/*.svn',
      before: function(csv) {
        return csv.split(',');
      },
    },
    excludesFile: {
      description: 'Would you like to load excludes from file?',
      default: '.gitignore,~/.gitignore',
      before: (csv) => csv.split(','),
    },
    prefersEncrypted: {
      description: 'Would you like to encrypt the sync messages? (yes/no):',
      before: util.toBoolean,
      default: 'no',
    },
    websocketPort: {
      description: 'What port should sicksync use for this project?',
      default: 8675,
    },
    followSymLinks: {
      description: 'Should sicksync follow symlinks?',
      default: 'no',
      before: util.toBoolean,
    },
  };

  if (_.isUndefined(config.debug)) {
    questions.debug = {
      description: 'Would you like to see debug messages? (yes/no):',
      before: util.toBoolean,
      default: 'yes',
    };
  }

  if (_.isUndefined(config.retryOnDisconnect)) {
    questions.retryOnDisconnect = {
      description: 'Would you like sicksync to retry connecting if it gets disconnected?',
      default: 'yes',
      before: util.toBoolean,
    };
  }

  sicksyncSetup.get({
    properties: questions,
  }, (err, result) => {
    if (err) return console.info('\nLooks we had a problem setting up: ' + err);

    if (_.isUndefined(config.debug)) {
      config.debug = result.debug;
      delete result.debug;
    }

    if (_.isUndefined(config.retryOnDisconnect)) {
      config.retryOnDisconnect = result.retryOnDisconnect;
      delete result.retryOnDisconnect;
    }

          // Save our project in the main config
    config.version = version;
    config.projects = config.projects || [];
    config.projects.push(result);

          // Write
    util.writeConfig(config);
  });
};

export const remove = (config, projects) => {
  const updatedConfig = _.clone(config);

  updatedConfig.projects = _.filter(config.projects, (projectConf) => {
    if (_.contains(projects, projectConf.project)) return false;
    return true;
  });

  util.writeConfig(updatedConfig);
};

export const info = (config, projects) => {
  if (_.isEmpty(config) || _.isEmpty(config.projects)) {
    return console.info('No projects! Add some by running', green('`sicksync add-project`'));
  }

  if (_.isEmpty(projects)) {
    _.each(config.projects, (project) => {
      printProjectInfo(project);
    });
  }

  _.each(projects, (project) => {
    const foundProject = _.findWhere(config.projects, { project });

    if (foundProject) {
      printProjectInfo(_.findWhere(config.projects, { project }));
    } else {
      console.info(yellow(`Couldn't locate ${project} inside your config file, add it with 'sicksync add'!`));
    }
  });
};
