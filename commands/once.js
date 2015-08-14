var _ = require('lodash'),
    bigSync = require('../lib/big-sync'),
    util = require('../lib/util');

module.exports = function sicksyncOnceCommand(program, config) {
    program
        .command('once <projects...>')
        .description('Runs a one-time sync')
        .option('-n, --dry-run', 'Shows information on what files will be sent without sending them')
        .action(function(projects, opts) {
            _.each(projects, function(project) {
                if (_.isEmpty(config.projects[project])) {
                    return console.log('Could\'t sync project since it was not found in your config:', project);
                }
                var projectConf = config.projects[project];
                var log = util.generateLog(projectConf.project, projectConf.hostname);
                
                log('Starting one-time sync');

                bigSync(projectConf, {
                    dry: opts.dryRun,
                    debug: config.debug
                }, _.partial(log, 'Complete:'));
            });
        });
};
