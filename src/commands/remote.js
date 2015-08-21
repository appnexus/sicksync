let remote = require('../remote');

module.exports = function sicksyncRemoteCommand(program) {
    program
        .command('remote')
        .description('Starts the remote process of sicksync. Must be ran on the remote machine.')
        .option('-s, --secret <secret>', 'A secret used to only allow known subscribers (should match with your config).')
        .option('-p, --port <port>', 'The port in which to listen for incoming sync messages (should match with your config).', parseInt)
        .option('-e, --encrypt', 'Enable encryption on messages (should match with your config)')
        .option('-d, --debug', 'Show debug messages')
        .action(remote);
};
