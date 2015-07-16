var util = require('../lib/util'),
    prompter = util.setupPrompter(require('prompt'));

module.exports = function setupSicksyncCommand(program) {
    program
        .command('setup')
        .description('Runs the setup wizard. Happens automatically on new installs.')
        .action(function setupSicksync() {
            prompter.get({
                properties: {
                    hostname: {
                        description: 'What is the hostname or IP address of your remote machine? (e.g. yourhost.com):'
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
                        default: 8675
                    },
                    retryOnDisconnect: {
                        description: 'Would you like sicksync to retry connecting if it gets disconnected?',
                        default: true,
                        before: util.toBoolean,
                    },
                    followSymLinks: {
                        destinationLocation: 'Should sicksync follow symlinks?',
                        default: false,
                        before: util.toBoolean
                    }
                }
            }, function sicksyncWriteResults(err, result) {
                if (err) return console.log('\nLooks we had a problem setting up: ' + err);

                // Write
                util.writeConfig(result);
            });
        });
};