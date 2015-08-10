var util = require('../lib/util');

module.exports = function sicksyncOnceCommand(program) {
    program
        .command('config')
        .description('Opens the sicksync config file in your chosen editor.')
        .action(function() {
            util.open(util.getConfigPath());
        });
};
