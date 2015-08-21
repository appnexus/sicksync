import _ from 'lodash';
import fs from 'fs-extra';
import child from 'child_process';
import minimatch from 'minimatch';
import chalk from 'chalk';
import path from 'path';
import constants from '../conf/constants';
import text from '../conf/text';

let exec = child.exec,
    spawn = child.spawn,
    console = console,
    process = process;

export default {

    // Returns the ~ directory plus trailing `/`
    getHome() {
        return (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
    },

    // Returns the path to the sicksync dir
    getSicksyncDir() {
        return [this.getHome(), constants.SICKSYNC_DIR].join('/');
    },

    // Return the path to the update json
    getUpdatePath() {
        return this.getSicksyncDir() + '/' + constants.UPDATE_FILE;
    },

    // Returns the path the the config file
    getConfigPath() {
        return this.getSicksyncDir() + '/' + constants.CONFIG_FILE;
    },

    // Returns the config object if it exists, if not an empty object. Loads/saves from cache where possible
    getConfig() {
        let config = {},
            configPath = this.getConfigPath();

        if (fs.existsSync(configPath)) {
            config = require(configPath);
        }

        // Return a cloned copy of config to avoid indirect changes
        return _.cloneDeep(config);
    },

    // Randomly generate a unique ID
    getId() {
        return Math.random().toString(36).substr(2, 9) + Date.now();
    },

    // Write out the config file with a provided <obj>
    writeConfig(configFile) {
        let configPath = this.getConfigPath();

        fs.outputFileSync(configPath, JSON.stringify(configFile, null, 4));
        console.log(text.CONFIG_SAVED);
    },

    // Given a file path, check to see if it's in the excludes array
    isExcluded(filepath, excludes) {
        let result = false;

        excludes.forEach(function(exclude) {
            if (minimatch(filepath, exclude)) result = true;
        });

        return result;
    },

    // Log messages with Hostname prepended
    generateLog(projectName, hostname) {
        let args = _.slice(arguments);

        // If only one argument it's the hostname
        if (args.length === 1) {
            projectName = null;
            hostname = args[0];
        }

        return function log() {
            let args = [
                projectName ? chalk.blue('[' + projectName + ']') : '',
                hostname ? chalk.green('[' + hostname + ']') : ''
            ].concat([].slice.call(arguments));

            console.log.apply(console, args);
        };
    },

    //
    // Rebounce
    //
    // Takes a desired function, a fallback function, the number of times
    // called, and a cool down. Returns a `rebounced` function.
    //
    // The basic idea is that we want to limit calls to function to a
    // certain # of times in a given time-frame. If it breaks over that,
    // then we fallback to another function, and halt previous desired calls
    rebounce(primaryFn, secondaryFn, fallOverAmount, coolDown) {
        let timesCalled = 0;
        let timeOutIds = [];
        let fallbackCalled = false;

        return function rebounced() {
            let args = arguments;
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
    },
    ensureTrailingSlash(path) {
        return (path.substring(path.length - 1) === '/') ? path : path + '/';
    },
    open(parameter) {
        return exec('open ' + parameter);
    },
    toBoolean(param) {
        let lowerParam = param.toLowerCase();
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
    },
    setupPrompter(prompt) {
        prompt.message = '';
        prompt.delimiter = '';
        prompt.start();

        return prompt;
    },
    shellIntoRemote(remote) {
        return spawn('ssh',[
            '-tt',
            remote
        ]);
    },
    printLogo() {
        console.log(chalk.blue(fs.readFileSync(path.resolve(__dirname, '../conf/logo.txt')).toString()));
    },
    uniqInstance(tokenPath, Constructor) {
        let instances = {};

        return function(args) {
            let token = _.get(args, tokenPath, null);

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
};
