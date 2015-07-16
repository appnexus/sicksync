var remote = require('../lib/remote');

module.exports = function sicksyncRemoteCommand(program) {
	program
        .command('remote')
        .description('Starts the remote portion of sicksync.')
        .option('-s, --secret <secret>', 'A secret used to block unkown subscribers (should match config.secret).')
        .action(remote);
};