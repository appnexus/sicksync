import Rsync from 'rsync';
import _ from 'lodash';
import { hostname } from 'os';
import { generateLog, ensureTrailingSlash } from './util';

function bigSync(project) {
    let log = generateLog(project.project, hostname());

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
        .source(ensureTrailingSlash(project.sourceLocation))
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

export default bigSync;