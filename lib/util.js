var fs = require('fs-extra'),
    child = require('child_process'),
    minimatch = require('minimatch'),
    hostname = require('os').hostname(),
    colors = require('cli-color'),
    exec = child.exec,
    configCache = null;

var CONFIG_FILE = 'config.json',
    SICKSYNC_DIR = '.sicksync';

module.exports = {

    // Returns the ~ directory plus trailing `/`
    getHome: function() {
        return (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
    },

    // Returns the path the the config file
    getConfigPath: function() {
        return [this.getHome(), SICKSYNC_DIR, CONFIG_FILE].join('/');
    },

    // Returns the config object if it exists, if not an empty object. Loads/saves from cache where possible
    getConfig: function() {
        if (configCache) return configCache;
        var configPath = this.getConfigPath();

        configCache = (fs.existsSync(configPath)) ?
            require(configPath) :
            {};

        return configCache;
    },

    // Randomly generate a unique ID
    getId: function() {
        return Math.random().toString(36).substr(2, 9) + Date.now();
    },

    // Write out the config file with a provided <obj>, also trys to sync with devbox
    writeConfig: function(configFile) {
        var configPath = this.getConfigPath();

        fs.outputFileSync(configPath, JSON.stringify(configFile, null, 4));
        console.log(colors.green('Successfully wrote ' + configPath));
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
    log: function() {
        var args = [colors.green('[' + hostname + ']')].concat([].slice.call(arguments));

        console.log.apply(console, args);
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
    setupPrompter: function(prompt) {
        prompt.message = '';
        prompt.delimiter = '';
        prompt.start();

        return prompt;
    }
};