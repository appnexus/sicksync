var program = require('commander'),
    packageJson = require('./packageJson.json'),
    updates = require('./lib/update'),
    util = require('./lib/util');

var config = util.getConfig();

require('./commands')(program, config);

module.exports = function() {
    program
        .version(packageJson.version)
        .usage('<command> [options]')
        .parse(process.argv);

    // Run help if no command is provided
    if (!process.argv.slice(2).length) {
        util.printLogo();
        program.outputHelp();
    }

    // Run/Display update notifications
    updates.check();
    updates.notify();
};
