var local = require('../lib/local/index.js');

module.exports = function sicksyncStartCommand(program) {
    program
        .command('start')
        .description('Starts the continuous sicksync procees')
        .action(local);
};
