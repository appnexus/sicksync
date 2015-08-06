var remote = require('../lib/remote/index');

module.exports = function sicksyncRemoteCommand(program) {
	program
        .command('remote')
        .option('-s, --secret <secret>', 'A secret used to block unkown subscribers (should match with your config).')
        .option('-p, --port <port>', 'The port in which to listen for incoming sync messages (should match with your config).')
        .option('-d, --debug', 'Show debug messages')
        .option('-e, --encrypt', 'Enable encryption on messages')
        .action(remote);
};
