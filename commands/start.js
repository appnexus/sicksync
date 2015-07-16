var local = require('../lib/local'),
    remotem = require('../lib/remote');

module.exports = function sicksyncStartCommand(program) {
    program
        .command('start', { isDefault: true })
        .description('Starts the continuous sicksync procees')
        .action(local);
};
