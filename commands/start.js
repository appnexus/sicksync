var _ = require('lodash'),
    chalk = require('chalk'),
    local = require('../lib/local/index.js').start;

module.exports = function sicksyncStartCommand(program, config) {
    program
        .command('start <projects...>')
        .description('Starts the continuous sicksync process.')
        .action(function(projects) {
            var projectsInConfig = _.filter(projects, function(project) {
                if (_.isEmpty(config.projects[project])) {
                    console.log(chalk.yellow(project), 'wasn\'t found in your config and can\'t be synced. Add it with `sicksync add-project`');
                    return false;
                }
                return true;
            });

            local(projectsInConfig, config);
        });
};
