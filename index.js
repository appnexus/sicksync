var _ = require('lodash'),
    program = require('commander'),
    package = require('./package.json'),
    updates = require('./lib/update'),
    util = require('./lib/util'),
    start = require('./lib/local'),
    setup = require('./lib/setup');

require('./commands/index.js')(program);

program
    .version(package.version)
    .usage('<command> [options]')
    .parse(process.argv);

// No config yet
if (_.isEmpty(util.getConfig())) {
    util.printLogo();
    return setup();
}

// Run `sicksync start` if no other command
if (!process.argv.slice(2).length) {
    return start();
}

// Run/Display update notifications
updates.checkForUpdates();
updates.notifyUpdates();
