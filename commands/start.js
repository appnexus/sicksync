var _ = require('lodash'),
    clc = require('cli-color'),
    local = require('../lib/local/index.js');

module.exports = function sicksyncStartCommand(program, config) {
    program
        .command('start <projects>')
        .description('Starts the continuous sicksync process. <projects> being comma-separated.')
        .action(function(projects) {
            var projectsInConfig = _.filter(projects.split(','), function(project) {
                if (_.isEmpty(config.projects[project])) {
                    console.log(clc.yellow(project), 'wasn\'t found in your config and can\'t be synced. Add it with `sicksync add-project`');
                    return false;
                }
                return true;
            });
            local(projectsInConfig, config);
        });
};
