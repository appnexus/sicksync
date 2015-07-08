var Rsync = require('rsync'),
    _ = require('lodash'),
    util = require('../lib/util'),
    config = util.getConfig();

function consoleLogFromBuffer(buffer) {
    console.log(buffer.toString());
}

module.exports = function bigSync(onComplete) {

    if (_.isEmpty(config)) {
        return console.log('Please run `sicksync --setup` before doing a one-time sync');
    }

    var rsync = new Rsync()
        .shell('ssh')
        .flags('az')
        .exclude(config.excludes)
        .source(config.sourceLocation)
        .set('delete')
        .destination(config.hostname + ':' + config.destinationLocation);

    if (config.debug) {
        rsync.set('progress');
        rsync.output(consoleLogFromBuffer, consoleLogFromBuffer);
    }
    rsync.execute(onComplete);
};