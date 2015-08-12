var setup = require('../lib/setup');

module.exports = function setupSicksyncCommand(program) {
    program
        .command('remove-project <project>')
        .description('Removes a project from sicksync.')
        .action(setup);
};
