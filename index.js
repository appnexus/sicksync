#! /usr/bin/env node

/**
 *  Sick Sync
 *
 *  Entry point for the syncin' script. This will run
 *  EVERYTIME a sync is kicked off.
 */
var fs = require('fs-extra'),
    program = require('commander'),
    util = require('./lib/util'),
    package = require('./package.json'),
    bigSync = require('./lib/big-sync'),
    configPath = util.getConfigPath(),
    hasSetup = fs.existsSync(configPath),
    config = null;

require('colors');

program
    .version(package.version)
    .option('-s, --setup', 'Runs the sicksync setup wizard (happens automatically the first time)')
    .option('-d, --debug <boolean>', 'Turns on debug messages during sicksyncs', util.toBoolean)
    .option('-e, --encrypt <boolean>', 'Turns on encryption for sicksync messages', util.toBoolean)
    .option('-c, --config', 'Opens the config file in your chosen editor')
    .option('-o, --Once', 'Runs a one-time sync')
    .parse(process.argv);

if (program.setup || !hasSetup) {
    return require('./bin/setup.js');
}

if (hasSetup) {
    config = require(configPath);

    if (typeof program.encrypt !== 'undefined') {
        config.prefersEncrypted = program.encrypt;
        return util.writeConfig(config);
    }

    if (typeof program.debug !== 'undefined') {
        config.debug = program.debug;
        return util.writeConfig(config);
    }

    if (program.config) {
        return util.open(configPath);
    }

    if (program.Once) {
        console.log('Syncing...');
        return bigSync(function() {
            console.log('Finished!'.green);
        });
    }

    return require('./bin/local.js');
}