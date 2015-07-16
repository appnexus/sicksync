var local = require('../lib/local');

module.exports = function sicksyncStartCommand(program) {
    program
        .command('start', { isDefault: true })
        .description('Starts the continuous sicksync procees')
        .action(local);
};
