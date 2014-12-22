var fs = require('fs-extra'),
    child = require('child_process'),
    minimatch = require('minimatch'),
    exec = child.exec,
    fork = child.fork,
    configDir = '.sicksync-config.json',
    sicksyncServer = null;

module.exports = {

    // Returns the ~ directory plus trailing `/`
    getHome: function() {
        return (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/';
    },

    // Returns the path the the config file
    getConfigPath: function() {
        return this.getHome() + configDir;
    },

    // Returns the config object if it exists, if not an empty object
    getConfig: function() {
        var configPath = this.getConfigPath();
        return (fs.existsSync(configPath)) ? require(configPath) : {};
    },

    // Returns a boolean if the object is empty
    isEmpty: function(obj) {
        return Object.keys(obj).length === 0;
    },

    // Randomly generate a unique ID
    getId: function() {
        return Math.random().toString(36).substr(2, 9) + Date.now();
    },

    // Write out the config file with a provided <obj>, also trys to sync with devbox
    writeConfig: function(configFile) {
        var configPath = this.getConfigPath();

        fs.outputFileSync(configPath, JSON.stringify(configFile, null, 4));
        console.log('Successfully wrote ' + configPath.green);

        if (configFile.syncsRemotely) {
            this.writeConfigToDev(configFile);
        }
    },

    // SCP's the config file over to the remote machine
    writeConfigToDev: function(configFile) {
        var configPath = this.getConfigPath();

        exec('scp ' + configPath + ' ' + configFile.userName + '@' + configFile.hostname + ':~/' + configDir, function(error) {
            if (error) throw new Error('We couldn\'t copy over the config to your devbox, please copy ~/.sicksync-config.json to your devbox in the same location'.red);
            console.log('Config copied successfully!'.green);
        });
    },

    // Given a file path, check to see if it's in the excludes array
    isExcluded: function(filepath, excludes) {
        var result = false;

        excludes.forEach(function(exclude) {
            if (minimatch(filepath, exclude)) result = true;
            if (filepath.indexOf(exclude) > -1) result = true;
        });

        return result;
    },

    //
    // Rebounce
    //
    // Takes a desired function, a fallback function, the number of times
    // called, and a throttleTime. Returns a `rebounced` function.
    //
    // The basic idea is that we want to limit calls to function to a
    // certain # of times in a given time-frame. If it breaks over that,
    // then we fallback to another function, and halt previous desired calls
    rebounce: function(desiredFn, fallbackFn, numTimes, throttleTime) {
        var timesCalled = 0;
        var timeOutIds = [];
        var fallbackCalled = false;

        return function rebounced() {
            var args = arguments;
            timesCalled++;

            timeOutIds.push(setTimeout(function() {
                timesCalled = 0;
                desiredFn.apply(null, args);
            }, throttleTime));

            if (timesCalled >= numTimes) {
                timeOutIds.forEach(clearTimeout);

                /* istanbul ignore else */
                if (!fallbackCalled) {
                    timesCalled = 0;
                    fallbackCalled = true;
                    fallbackFn.apply(null, arguments);
                    setTimeout(function() {
                        fallbackCalled = false;
                    }, throttleTime);
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
    wakeDevBox: function(host, fn) {
        if (!host) throw new Error('#wakeDevBox needs a host to query');

        sicksyncServer = fork(__dirname + '/../bin/server-start', null, {
            silent: true
        });

        sicksyncServer.on('message', fn);
    },
    setupPrompter: function(prompt) {
        prompt.message = '';
        prompt.delimiter = '';
        prompt.start();
    }
};
