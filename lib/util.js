var _ = require('lodash'),
    fs = require('fs-extra'),
    child = require('child_process'),
    minimatch = require('minimatch'),
    chalk = require('chalk'),
    path = require('path'),
    constants = require('../conf/constants'),
    exec = child.exec,
    spawn = child.spawn,
    configCache = null;

module.exports = {

    // Returns the ~ directory plus trailing `/`
    getHome: function() {
        return (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
    },

    // Returns the path to the sicksync dir
    getSicksyncDir: function() {
        return [this.getHome(), constants.SICKSYNC_DIR].join('/');
    },

    // Return the path to the update json
    getUpdatePath: function() {
        return this.getSicksyncDir() + '/' + constants.UPDATE_FILE;
    },

    // Returns the path the the config file
    getConfigPath: function() {
        return this.getSicksyncDir() + '/' + constants.CONFIG_FILE;
    },

    // Returns the config object if it exists, if not an empty object. Loads/saves from cache where possible
    getConfig: function() {
        var config = null,
            configPath = this.getConfigPath();

        if (configCache) {
            config = configCache;
        } else if (fs.existsSync(configPath)) {
            config = configCache = require(configPath);
        } else {
            config = {};
        }

        // Return a cloned copy of config to avoid indirect changes
        return _.cloneDeep(config);
    },

    // Randomly generate a unique ID
    getId: function() {
        return Math.random().toString(36).substr(2, 9) + Date.now();
    },

    // Write out the config file with a provided <obj>
    writeConfig: function(configFile) {
        var configPath = this.getConfigPath();

        fs.outputFileSync(configPath, JSON.stringify(configFile, null, 4));
        console.log(chalk.green('Successfully wrote ' + configPath));
    },

    // Given a file path, check to see if it's in the excludes array
    isExcluded: function(filepath, excludes) {
        var result = false;

        excludes.forEach(function(exclude) {
            if (minimatch(filepath, exclude)) result = true;
        });

        return result;
    },

    // Log messages with Hostname prepended
    generateLog: function(projectName, hostname) {
        var args = _.slice(arguments);

        // If only one argument it's the hostname
        if (args.length === 1) {
            projectName = null;
            hostname = args[0];
        }

        return function log() {
            var args = [
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
    rebounce: function(primaryFn, secondaryFn, fallOverAmount, coolDown) {
        var timesCalled = 0;
        var timeOutIds = [];
        var fallbackCalled = false;

        return function rebounced() {
            var args = arguments;
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
    ensureTrailingSlash: function(path) {
        return (path.substring(path.length - 1) === '/') ? path : path + '/';
    },
    open: function(parameter) {
        return exec('open ' + parameter);
    },
    toBoolean: function(param) {
        var lowerParam = param.toLowerCase();
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
    setupPrompter: function(prompt) {
        prompt.message = '';
        prompt.delimiter = '';
        prompt.start();

        return prompt;
    },
    shellIntoRemote: function(remote) {
        return spawn('ssh',[
            '-tt',
            remote
        ]);
    },
    printLogo: function() {
        console.log(chalk.blue(fs.readFileSync(path.resolve(__dirname, '../conf/logo.txt')).toString()));
    },
    uniqInstance: function(tokenPath, Constructor) {
        var instances = {};

        return function(args) {
            var token = _.get(args, tokenPath, null);

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