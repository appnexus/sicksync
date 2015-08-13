var _ = require('lodash'),
    projectHelper = require('../lib/project-helper');

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('info [project...]')
        .description('Shows the information for the supplied project(s)')
        .action(_.partial(projectHelper.info, config));
};
