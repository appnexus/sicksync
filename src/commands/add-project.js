let _ = require('lodash'),
    projectHelper = require('../project-helper');

module.exports = function setupSicksyncCommand(program, config) {
    program
        .command('add-project')
        .alias('add')
        .description('Adds a new project to sicksync.')
        .action(_.partial(projectHelper.add, config));
};
