var update = require('../lib/update'),
    package = require('../package.json');

module.exports = function sicksyncOnceCommand(program/*, config */) {
    program
        .command('update')
        .description('Updates sicksync on both your local and remote machines')
        .option('-c, --check, Checks to see the latest version of sicksync')
        .action(function(cmd) {
            if (cmd.check) {
                return update.getLatestVersion(function(err, version) {
                    if (err) return;
                    console.log('Latest Version:', version);
                    console.log('Current Version:', package.version);
                });
            }
            return update.update();
        });
};
