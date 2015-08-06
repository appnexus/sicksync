var Rsync = require('rsync'),
    _ = require('lodash'),
    util = require('../lib/util'),
    config = util.getConfig();

function consoleLogFromBuffer(buffer) {
    util.log(buffer.toString());
}

module.exports = function bigSync() {
    if (_.isEmpty(config)) {
        return util.log('Please run `sicksync setup` before doing a one-time sync');
    }

    var params = _.isPlainObject(_.first(arguments)) ?
        _.first(arguments) :
        {};

    var onComplete = _.isFunction(_.last(arguments)) ?
        _.last(arguments) :
        _.noop;

    var rsync = new Rsync()
        .shell('ssh')
        .flags('az')
        .exclude(config.excludes)
        .source(config.sourceLocation)
        .set('delete')
        .destination(config.hostname + ':' + config.destinationLocation);

    if (params.isDryRun) {
        rsync.dry();
    }

    if (config.debug) {
        rsync.progress();
        rsync.output(consoleLogFromBuffer, consoleLogFromBuffer);
    }

    rsync.execute(onComplete);
};
