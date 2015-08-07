var update = require('../lib/update');

module.exports = function sicksyncOnceCommand(program) {
    program
        .command('update')
        .description('Updates sicksync on both your local and remote machines')
        .option('-c, --check, Checks to see if a new version is available')
        .action(function(cmd) {
            if (cmd.check) {
                if (!update.notifyUpdates()) {
                    console.log('Up to date!');
                }
                return;
            }
            return update.update();
        });
};
