/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
import _ from 'lodash';
import os from 'os';
import untildify from 'untildify';
import gitignore from 'parse-gitignore';

import constants from '../../conf/constants';
import text from '../../conf/text';
import eventsConf from '../../conf/events';
import bigSync from '../big-sync';
import {
  uniqInstance,
  ensureTrailingSlash,
  getProjectsFromConfig,
  generateLog,
  getId,
} from '../util';

const FSHelper = uniqInstance(constants.FS_TOKEN, require('./fs-helper'));
const WebSocketClient = uniqInstance(constants.WS_TOKEN, require('./ws-client'));

const hostname = os.hostname();
const wsEvents = eventsConf.WS.LOCAL;
const fsEvents = eventsConf.FS.LOCAL;

function triggerBigSync(project, params, cb) {
  bigSync({
    project: project.project,
    excludes: project.excludes,
    sourceLocation: ensureTrailingSlash(project.sourceLocation),
    destinationLocation: ensureTrailingSlash(project.destinationLocation),
    hostname: project.hostname,
    username: project.username,
  }, params, cb);
}

function start(config, projects) {
  const foundProjects = getProjectsFromConfig(config, projects);

  if (_.isEmpty(foundProjects)) {
    return logProjectsNotFound(foundProjects);
  }

  _.each(foundProjects, (project) => {
    startProject(config, project);
  });
}

function startProject(config, projectConf) {
  const localLog = generateLog(projectConf.project, hostname);
  const remoteLog = generateLog(projectConf.project, projectConf.hostname);
  const sourceLocation = ensureTrailingSlash(projectConf.sourceLocation);
  const destinationLocation = ensureTrailingSlash(projectConf.destinationLocation);
  const secret = getId();

    // parse excludesFile
  projectConf.excludes = [].concat.apply(projectConf.excludes, projectConf.excludesFile.map(untildify).map(gitignore));

  const fsHelper = new FSHelper({
    sourceLocation: sourceLocation,
    excludes: projectConf.excludes,
    followSymlinks: projectConf.followSymlinks,
  });

  const wsClient = new WebSocketClient({
    username: projectConf.username,
    hostname: projectConf.hostname,
    websocketPort: projectConf.websocketPort,
    secret: secret,
    prefersEncrypted: projectConf.prefersEncrypted,
    retryOnDisconnect: config.retryOnDisconnect,
  });

    // WS events
  wsClient.on(wsEvents.READY, () => {
    triggerBigSync(projectConf, { debug: config.debug }, () => {
      fsHelper.watch();

      localLog(
                text.SYNC_ON_CONNECT,
                projectConf.hostname, (projectConf.prefersEncrypted) ? 'using' : 'not using',
                'encryption'
            );
    });
  });

  wsClient.on(wsEvents.RECONNECTING, _.partial(_.ary(localLog, 1), text.SYNC_ON_RECONNECT));

  wsClient.on(wsEvents.DISCONNECTED, () => {
    localLog(text.SYNC_ON_DISCONNECT);
    process.exit();
  });

  wsClient.on(wsEvents.REMOTE_NOT_FOUND, (err) => {
    localLog(text.SYNC_ON_REMOTE_NOT_FOUND, projectConf.hostname, err);
    process.exit();
  });

  wsClient.on(wsEvents.REMOTE_MESSAGE, (message) => {
        // Since WS can be shared amongst projects, filter out
        // any that are not in this project
    if (_.contains(message, destinationLocation)) {
      remoteLog(message);
    }
  });

    // FS events
  fsHelper.on(fsEvents.CHANGE, (fileChange) => {
    fileChange.destinationpath = destinationLocation + fileChange.relativepath;
    fileChange.subject = 'file';

    localLog('>', fileChange.changeType, fileChange.localpath);

    wsClient.send(fileChange);
  });

  fsHelper.on(fsEvents.LARGE, () => {
    localLog(text.SYNC_ON_LARGE_CHANGE);
    fsHelper.pauseWatch();

    triggerBigSync(projectConf, { debug: config.debug }, () => {
      localLog(text.SYNC_ON_LARGE_CHANGE_DONE);
      fsHelper.watch();
    });
  });
}

function once(config, projects, opts) {
  const foundProjects = getProjectsFromConfig(config, projects);

  if (_.isEmpty(foundProjects)) {
    return logProjectsNotFound(foundProjects);
  }

  _.each(foundProjects, (project) => {
    const localLog = generateLog(project.project, hostname);

    localLog(text.SYNC_ON_ONCE);

    triggerBigSync(project, {
      dry: opts.dryRun,
      debug: config.debug,
    }, _.partial(localLog, text.SYNC_ON_ONCE_DONE));
  });
}

function logProjectsNotFound(projects) {
  const projectsWanted = projects.length ?
        projects :
        process.cwd();

  console.info(text.PROJECT_NOT_FOUND, projectsWanted);
}

export default { start, once };
