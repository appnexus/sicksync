var _ = require('lodash'),
    program = require('commander'),
    package = require('./package.json'),
    updates = require('./lib/update'),
    util = require('./lib/util'),
    start = require('./lib/local'),
    addRemote = require('./lib/project-helper').add;

var config = util.getConfig();

require('./commands/index.js')(program, config);

module.exports = function() {
    program
        .version(package.version)
        .usage('<command> [options]')
        .parse(process.argv);

    // No config yet
    if (_.isEmpty(config) || _.isEmpty(config.projects)) {
        util.printLogo();
        return addRemote(config);
    }

    // Run `sicksync start` if no other command
    if (!process.argv.slice(2).length) {
        start();
    }

    // Run/Display update notifications
    updates.check();
    updates.notify();
};
