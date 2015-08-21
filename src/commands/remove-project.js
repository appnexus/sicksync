let _ = require('lodash'),
    projectHelper = require('../project-helper');

module.exports = function removeProjectCommand(program, config) {
    program
        .command('remove-project <project...>')
        .alias('rm')
        .description('Removes a project from sicksync.')
        .action(_.partial(projectHelper.remove, config));
};
