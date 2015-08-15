var _ = require('lodash'),
    local = require('../lib/local').start;

module.exports = function sicksyncStartCommand(program, config) {
    program
        .command('start <projects...>')
        .description('Starts the continuous sicksync process for the given project(s)')
        .action(_.partialRight(local, config));
};
