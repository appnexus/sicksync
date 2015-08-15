var _ = require('lodash'),
    once = require('../lib/local').once,
    util = require('../lib/util');

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('once <projects...>')
        .description('Runs a one-time sync on the supplied project(s)')
        .option('-n, --dry-run', 'Shows information on what files will be sent without sending them')
        .action(_.partialRight(once, config));
};
