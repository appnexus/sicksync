var chalk = require('chalk');

module.exports = {
    PROJECT_NOT_FOUND: chalk.yellow('Sicksync couldn\'t find this project in your config:'),
    SYNC_ON_ONCE: 'Starting a one-time sync',
    SYNC_ON_ONCE_DONE: chalk.green('One-time sync complete!'),
    SYNC_ON_CONNECT: chalk.green('Connected'),
    SYNC_ON_RECONNECT: chalk.yellow('Reconnecting'),
    SYNC_ON_DISCONNECT: chalk.red('Lost connection'),
    SYNC_ON_REMOTE_NOT_FOUND: chalk.red('Couldn\'t find sicksync in $PATH on'),
    SYNC_ON_LARGE_CHANGE: chalk.yellow('Sending a large change'),
    SYNC_ON_LARGE_CHANGE_DONE: chalk.green('Large change sent!'),
    SERVER_ON_UNAUTHORIZED: chalk.red('Unauthorized connection, shutting down'),
    SERVER_ON_CONNECTION_CLOSED: chalk.red('Connection closed, shutting down'),
    SERVER_ON_READY: chalk.green('|=====SICKSYNC-READY=====|'),
    REMOTE_MISSING_PORT: chalk.red('--port, -p, is required. See `sicksync remote -h`'),
    REMOTE_MISSING_SECRET: chalk.red('--secret, -s, is required. See `sicksync remote -h`'),
    CONFIG_SAVED: chalk.green('Successfully saved the config!'),
    UPDATE_SUCCESS: chalk.green('Updated Successfully!'),
    UPDATE_FAIL: chalk.red('Update failed! Please run manually'),
    UPDATE_AVAILABLE: chalk.green('Sicksync update available!')
};
