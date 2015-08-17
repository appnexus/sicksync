var Rsync = require('rsync'),
    _ = require('lodash'),
    hostname = require('os').hostname(),
    util = require('../lib/util');

module.exports = function bigSync(project) {
    var log = util.generateLog(project.project, hostname);

    function consoleLogFromBuffer(buffer) {
        log(buffer.toString());
    }

    var params = _.isPlainObject(_.get(arguments, 1)) ?
        _.get(arguments, 1) :
        {};

    var onComplete = _.isFunction(_.last(arguments)) ?
        _.last(arguments) :
        _.noop;

    var rsync = new Rsync()
        .shell('ssh')
        .flags('az')
        .exclude(project.excludes)
        .source(util.ensureTrailingSlash(project.sourceLocation))
        .set('delete')
        .destination(project.username + '@' + project.hostname + ':' + project.destinationLocation);

    if (params.dry) {
        rsync.set('dry-run');
    }

    if (params.debug) {
        rsync.progress();
        rsync.output(consoleLogFromBuffer, consoleLogFromBuffer);
    }

    rsync.execute(onComplete);
};
