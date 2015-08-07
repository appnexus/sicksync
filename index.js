var program = require('commander'),
    package = require('./package.json'),
    updateNotifier = require('update-notifier');

// Inject our commands
require('./commands/index.js')(program);

// Notify any updates
updateNotifier({pkg: package}).notify();

// Mount our comand
program
    .version(package.version)
    .usage('<command> [options]')
    .parse(process.argv);

// Show help if no sub-command is run
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
