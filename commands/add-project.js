var addRemote = require('../lib/add-remote');

module.exports = function setupSicksyncCommand(program) {
    program
        .command('add-project')
        .description('Adds a new project to sicksync.')
        .action(addRemote);
};
