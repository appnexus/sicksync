/**
 *  Server Setup
 *
 *  Asks some questions, gets some answers and saves them
 */
var prompter = require('prompt'),
    util = require('../lib/util');

require('colors');
util.setupPrompter(prompter);
console.log('Setting up sicksync!'.green);

prompter.get({
    properties: {
        hostname: {
            description: 'What is the hostname or IP address of your remote machine? (e.g. joelgriffith.dev.net):'
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
            default: '.git/*,.idea/*,public/bundles/*',
            before: function(csv) {
                return csv.split(',');
            }
        },
        prefersEncrypted: {
            description: 'Would you like to encrypt the sync messages? (yes/no):',
            before: util.toBoolean,
            default: 'no'
        },
        debug: {
            description: 'Would you like to see debug messages? (yes/no):',
            before: util.toBoolean,
            default: 'yes'
        },
        websocketPort: {
            description: 'What port should sicksync use?:',
            default: 8888
        }
    }
}, function(err, result) {
    if (err) return console.log(('\nLooks we had a problem setting up: ' + err).red);

    // Set some manual flags
    result.secret = util.getId();
    result.syncsRemotely = true;

    // Write
    util.writeConfig(result);
});
