var _ = require('lodash'),
    util = require('../lib/util');

module.exports = function sicksyncOnceCommand(program/*, config */) {
    program
        .command('config')
        .description('Opens the sicksync config file in your chosen editor.')
        .action(_.partial(util.open, util.getConfigPath()));
};
