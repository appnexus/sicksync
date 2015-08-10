var setup = require('../lib/setup');

module.exports = function setupSicksyncCommand(program) {
    program
        .command('setup')
        .description('Runs the setup wizard. Happens automatically on new installs.')
        .action(setup);
};