let _ = require('lodash'),
    projectHelper = require('../project-helper');

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('info [project...]')
        .description('Shows the information for the supplied project(s)')
        .action(_.partial(_.ary(projectHelper.info, 2), config));
};
