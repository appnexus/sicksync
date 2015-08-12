var setup = require('../lib/setup');

module.exports = function setupSicksyncCommand(program) {
    program
        .command('add-project')
        .description('Adds a new project to sicksync.')
        .action(setup);
};
