var program = require('commander'),
    package = require('./package.json'),
    updates = require('./lib/update'),
    util = require('./lib/util'),
    start = require('./lib/local');

var config = util.getConfig();

require('./commands')(program, config);

module.exports = function() {
    program
        .version(package.version)
        .usage('<command> [options]')
        .parse(process.argv);

    // Run `sicksync start` if no other command
    if (!process.argv.slice(2).length) {
        start();
    }

    // Run/Display update notifications
    updates.check();
    updates.notify();
};
