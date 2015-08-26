let _ = require('lodash'),
    update = require('../update');

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('update')
        .description('Updates sicksync on both your local and remote machine(s)')
        .option('-c, --check', 'Checks to see the latest version of sicksync')
        .option('-m, --migrate-config', 'Updates your config for the most recent version for sicksync')
        .action(_.partial(update.update.bind(update), config));
};
