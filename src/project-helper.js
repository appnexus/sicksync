import _ from 'lodash';
import path from 'path';
import prompter from 'prompt';
import chalk from 'chalk';
import util from './util';

let sicksyncSetup = util.setupPrompter(prompter),
    console = console,
    process = process;

function printProjectInfo (project) {
    console.log(chalk.green(project.project));
    _.forIn(project, function(value, key) {
        console.log('  ', chalk.yellow(_.startCase(key)), value);
    });
}

export default {
    add (config) {
        let questions = {
            project: {
                description: 'What would you like to name this project?',
                required: true,
                default: _.last(process.cwd().split(path.sep)),
                message: 'Please enter a name for this project'
            },
            hostname: {
                description: 'What is the hostname or IP address of the machine you\'d like to sync this to?',
                required: true,
                message: 'Please enter a hostname or IP address'
            },
            username: {
                description: 'What is the username you use to shell into your remote machine?',
                required: true,
                default: process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME,
                message: 'Please enter a username.'
            },
            sourceLocation: {
                description: 'What is the absolute path of the directory you would like to sync from?',
                message: 'Please enter a valid path.',
                default: process.cwd(),
                required: true
            },
            destinationLocation: {
                description: 'What is the absolute path of the directory you wish to sync to?',
                message: 'Please enter a valid path.',
                default: process.cwd(),
                required: true
            },
            excludes: {
                description: 'Are there any files you\'d like to exclude? Use a comma separated list (supports globbing)',
                default: '.git/*,.idea/*,v2/public/bundles2/*',
                before: function(csv) {
                    return csv.split(',');
                }
            },
            websocketPort: {
                description: 'What port should sicksync use for this project?',
                default: 8675
            },
            followSymLinks: {
                description: 'Should sicksync follow symlinks?',
                default: 'no',
                before: util.toBoolean
            }
        };

        if (_.isUndefined(config.prefersEncrypted)) {
            questions.prefersEncrypted = {
                description: 'Would you like to encrypt the sync messages? (yes/no):',
                before: util.toBoolean,
                default: 'no'
            };
        }

        if (_.isUndefined(config.debug)) {
            questions.debug = {
                description: 'Would you like to see debug messages? (yes/no):',
                before: util.toBoolean,
                default: 'yes'
            };
        }

        if (_.isUndefined(config.retryOnDisconnect)) {
            questions.retryOnDisconnect = {
                description: 'Would you like sicksync to retry connecting if it gets disconnected?',
                default: 'yes',
                before: util.toBoolean
            };
        }

        sicksyncSetup.get({
            properties: questions
        }, function sicksyncWriteResults(err, result) {
            if (err) return console.log('\nLooks we had a problem setting up: ' + err);

            let project = result.project;

            if (!config.prefersEncrypted) {
                config.prefersEncrypted = result.prefersEncrypted;
                delete result.prefersEncrypted;
            }

            if (!config.debug) {
                config.debug = result.debug;
                delete result.debug;
            }

            if (!config.retryOnDisconnect) {
                config.retryOnDisconnect = result.retryOnDisconnect;
                delete result.retryOnDisconnect;
            }

            // Save our project in the main config
            config.projects = config.projects || {};
            config.projects[project] = result;

            // Write
            util.writeConfig(config);
        });
    },
    remove (config, projects) {
        _.each(projects, function(project) {
            if (_.isUndefined(config.projects[project])) {
                console.log(chalk.red('Couldn\'t remove project:'), project, 'since it doesn\'t exist in your config', '\n');
                console.log('Projects in your config:');
                _.forIn(config.projects, function(projectConf, projectName) {
                    console.log(projectName);
                });
                return;
            }

            delete config.projects[project];
        });

        util.writeConfig(config);
    },
    info (config, projects) {
        if (_.isUndefined(config.projects) || _.isEmpty(config.projects)) {
            console.log('No projects! Add some by running', chalk.green('`sicksync add-project`'));
        }

        if (_.isEmpty(projects)) {
            return _.forIn(config.projects, function(projectInfo) {
                printProjectInfo(projectInfo);
            });
        }

        _.forIn(projects, function(project) {
            printProjectInfo(config.projects[project]);
        });
    }
};
