let _ = require('lodash'),
    projectHelper = require('../project-helper');

module.exports = function removeProjectCommand(program, config) {
    program
        .command('remove-project <projects...>')
        .alias('rm')
        .description('Removes a project from sicksync.')
        .action(_.partial(_.ary(projectHelper.remove, 2), config));
};
