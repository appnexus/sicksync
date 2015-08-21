import Rsync from 'rsync';
import _ from 'lodash';
import os from 'os';
import util from './util';

let hostname = os.hostname();

export default function bigSync(project) {
    let log = util.generateLog(project.project, hostname);

    function consoleLogFromBuffer(buffer) {
        log(buffer.toString());
    }

    let params = _.isPlainObject(_.get(arguments, 1)) ?
        _.get(arguments, 1) :
        {};

    let onComplete = _.isFunction(_.last(arguments)) ?
        _.last(arguments) :
        _.noop;

    let rsync = new Rsync()
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
