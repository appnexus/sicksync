let _ = require('lodash'),
    once = require('../local').once;

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('once <projects...>')
        .description('Runs a one-time sync on the supplied project(s)')
        .option('-n, --dry-run', 'Shows information on what files will be sent without sending them')
        .action(_.partial(_.ary(once, 3), config));
};
