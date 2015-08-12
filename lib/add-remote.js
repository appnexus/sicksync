var _ = require('lodash'),
    prompter = require('prompt'),
    util = require('./util'),
    sicksyncSetup = util.setupPrompter(prompter);

module.exports = function setupSicksync(config) {
    var questions = {};

    if (_.isUndefined(config.prefersEncrypted)) {
        questions.prefersEncrypted ={
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

    sicksyncSetup.get({
        properties: {
            project: {
                description: 'What would you like to name this project?',
                required: true,
                message: 'Please enter a name for this project'
            },
            hostname: {
                description: 'What is the hostname or IP address of your remote machine? (e.g. yourhost.com):',
                required: true,
                message: 'Please enter a hostname or IP address'
            },
            userName: {
                description: 'What is the username you use to shell into your remote machine? (e.g. jgriffith)',
                required: true,
                message: 'Please enter a username.'
            },
            sourceLocation: {
                description: 'What is the absolute path of the directory you would like to sync from? (e.g. /Users/jgriffith/Projects/my-project/):',
                message: 'Please enter a valid path.',
                required: true,
                before: util.ensureTrailingSlash
            },
            destinationLocation: {
                description: 'What is the absolute path of the directory you wish to sync to: (e.g. /usr/local/my-project/)',
                message: 'Please enter a valid path.',
                required: true,
                before: util.ensureTrailingSlash
            },
            excludes: {
                description: 'Are there any files you\'d like to exclude? Use a comma separated list, supports globbing (e.g. .git/*,public/bundles/*,.idea/*)',
                default: '.git/*,.idea/*,v2/public/bundles/*',
                before: function(csv) {
                    return csv.split(',');
                }
            },
            websocketPort: {
                description: 'What port should sicksync use?:',
                default: 8675
            },
            retryOnDisconnect: {
                description: 'Would you like sicksync to retry connecting if it gets disconnected?',
                default: true,
                before: util.toBoolean,
            },
            followSymLinks: {
                description: 'Should sicksync follow symlinks?',
                default: false,
                before: util.toBoolean
            }
        }
    }, function sicksyncWriteResults(err, result) {
        if (err) return console.log('\nLooks we had a problem setting up: ' + err);

        // Generate a random secret for securely talking to the host(s)
        if (!config.secret) {
            config.secret = util.getId();
        }

        // Save our project in the main config
        config[result.project] = result;

        // Write
        util.writeConfig(config);
    });
};
