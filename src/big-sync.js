import Rsync from 'rsync';
import _ from 'lodash';
import os from 'os';
import { execSync } from 'child_process';
import { generateLog, ensureTrailingSlash } from './util';

export function bigSync(project) {
  const log = generateLog(project.project, os.hostname());

  function consoleLogFromBuffer(buffer) {
    log(buffer.toString());
  }

  const params = _.isPlainObject(_.get(arguments, 1)) ?
    _.get(arguments, 1) : {};

  const onComplete = _.isFunction(_.last(arguments)) ?
    _.last(arguments) :
    _.noop;

  if (os.platform() === 'win32') {
    project.sourceLocation = execSync('cygpath ' + project.sourceLocation).toString();
  }

  const rsync = new Rsync()
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
}

export default bigSync;
