var Rsync = require('rsync'),
    util = require('../lib/util'),
    config = require(util.getConfigPath()),
    excludes = config.excludes;

module.exports = function bigSync(onComplete) {
    var rsync = new Rsync()
        .shell('ssh')
        .flags('az')
        .exclude(excludes)
        .source(config.sourceLocation)
        .destination(config.hostname + ':' + config.destinationLocation);

    rsync.execute(onComplete);
};