var program = require('commander'),
    package = require('./package.json'),
    updates = require('./lib/update'),
    util = require('./lib/util');

// Inject our commands
require('./commands/index.js')(program);

// Check for updates (async)
updates.checkForUpdates();

// Mount our comand
program
    .version(package.version)
    .usage('<command> [options]')
    .parse(process.argv);

// Show help if no sub-command is run
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

// Print any updates
updates.notifyUpdates();
