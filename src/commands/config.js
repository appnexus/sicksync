let _ = require('lodash'),
    util = require('../util');

module.exports = function sicksyncOnceCommand(program/*, config */) {
    program
        .command('config')
        .description('Opens the sicksync config file in your chosen editor.')
        .action(_.partial(util.open, util.getConfigPath()));
};
