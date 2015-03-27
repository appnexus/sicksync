var Rsync = require('rsync'),
    util = require('../lib/util'),
    config = util.getConfig();

module.exports = function bigSync(onComplete) {

    if (util.isEmpty(config)) {
        return console.log('Please run `sicksync --setup` before doing a one-time sync');
    }

    var numDirsToSync = config.sourceLocation.length;
    var numCalls = 0;
    if (numDirsToSync !== config.destinationLocation.length) {
        console.log(numDirsToSync);
        console.log(config.destinationLocation.length);
        throw new Error('The number of source locations must match the number of destination locations');
    }

    function callbackAggregator() {
        numCalls++;
        if (numCalls === numDirsToSync) {
            onComplete();
        } else if (numCalls > numDirsToSync) {
            throw new Error('Tried to rsync more directories than there are listed in config.sourcelocation');
        }
    }

    config.sourceLocation.forEach(function (filepath, locationIndex) {
        var rsync = new Rsync()
        .shell('ssh')
        .flags('az')
        .exclude(config.excludes)
        .source(filepath)
        .destination(config.hostname + ':' + config.destinationLocation[locationIndex]);

        rsync.execute(callbackAggregator);
    });

    
};