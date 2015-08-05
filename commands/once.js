var bigSync = require('../lib/big-sync'),
    util = require('../lib/util');

module.exports = function sicksyncOnceCommand(program) {
    program
        .command('once')
        .description('Runs a one-time sync and returns execution')
        .option('-n, --dry-run', 'Shows information on what files will be sent without sending them')
        .action(function(cmd) {
            util.log('Starting one-time sync');
            bigSync({ dry: cmd.dryRun }, function() {
                util.log('Sync complete!');
            });
        });
};