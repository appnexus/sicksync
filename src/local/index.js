/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
import _ from 'lodash';
import os from 'os';
import untildify from 'untildify';
import gitignore from 'parse-gitignore';

import { FSHelper as FSConstructor } from './fs-helper';
import { WSClient as WSConstructor } from './ws-client';
import constants from '../../conf/constants';
import text from '../../conf/text';
import eventsConf from '../../conf/events';
import { bigSync } from '../big-sync';
import {
  uniqInstance,
  ensureTrailingSlash,
  getProjectsFromConfig,
  generateLog,
  getId,
} from '../util';

const hostname = os.hostname();
const wsEvents = eventsConf.WS.LOCAL;
const fsEvents = eventsConf.FS.LOCAL;

function triggerBigSync(project, params) {
  return bigSync({
    project: project.project,
    excludes: project.excludes,
    sourceLocation: ensureTrailingSlash(project.sourceLocation),
    destinationLocation: ensureTrailingSlash(project.destinationLocation),
    hostname: project.hostname,
    username: project.username,
    disableDeletion: project.disableDeletion,
  }, params);
}

export function start(config, projects) {
  const foundProjects = getProjectsFromConfig(config, projects);

  if (_.isEmpty(foundProjects)) {
    return logProjectsNotFound(foundProjects);
  }

  _.each(foundProjects, (project) => {
    startProject(config, project);
  });
}

function startProject(config, projectConf) {
  const FSHelper = uniqInstance(constants.FS_TOKEN, FSConstructor);
  const WebSocketClient = uniqInstance(constants.WS_TOKEN, WSConstructor);

  const localLog = generateLog(projectConf.project, hostname);
  const remoteLog = generateLog(projectConf.project, projectConf.hostname);
  const sourceLocation = ensureTrailingSlash(projectConf.sourceLocation);
  const destinationLocation = ensureTrailingSlash(projectConf.destinationLocation);
  const secret = getId();

  const fsHelper = new FSHelper({
    sourceLocation: sourceLocation,
    followSymlinks: projectConf.followSymlinks,
    excludes: _.concat(projectConf.excludes, _.chain(projectConf.excludesFile)
      .map(untildify)
      .map(gitignore)
      .flatten()
      .value()
    ),
  });

  const wsClient = new WebSocketClient({
    username: projectConf.username,
    hostname: projectConf.hostname,
    websocketPort: projectConf.websocketPort,
    secret: secret,
    prefersEncrypted: projectConf.prefersEncrypted,
  });

    // WS events
  wsClient.on(wsEvents.READY, async () => {
    if (!(config.disableRsync || projectConf.disableRsync)) {
      await triggerBigSync(projectConf, _.pick(config, ['debug', 'delete']));
    }
    fsHelper.watch();
    localLog(
      text.SYNC_ON_CONNECT,
      projectConf.hostname, (projectConf.prefersEncrypted) ? 'using' : 'not using',
      'encryption'
    );
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
    if (_.includes(message, destinationLocation)) {
      remoteLog(message);
    }
  });

    // FS events
  fsHelper.on(fsEvents.CHANGE, (fileChange) => {
    fileChange.destinationpath = destinationLocation + fileChange.sourcepath;
    fileChange.subject = 'file';

    localLog('>', fileChange.changeType, fileChange.sourcepath);

    wsClient.send(fileChange);
  });

  fsHelper.on(fsEvents.LARGE, async () => {
    localLog(text.SYNC_ON_LARGE_CHANGE);
    fsHelper.pauseWatch();
    if (!(config.disableRsync || projectConf.disableRsync)) {
      await triggerBigSync(projectConf, { debug: config.debug });
    }
    localLog(text.SYNC_ON_LARGE_CHANGE_DONE);
    fsHelper.watch();
  });
}

export function once(config, projects, opts) {
  const foundProjects = getProjectsFromConfig(config, projects);

  if (_.isEmpty(foundProjects)) {
    return logProjectsNotFound(foundProjects);
  }

  _.each(foundProjects, async (project) => {
    const localLog = generateLog(project.project, hostname);

    localLog(text.SYNC_ON_ONCE);

    if (!(config.disableRsync || project.disableRsync)) {
      await triggerBigSync(project, {
        dry: opts.dryRun,
        debug: config.debug,
      });
    }
    localLog(text.SYNC_ON_ONCE_DONE);
  });
}

function logProjectsNotFound(projects) {
  const projectsWanted = projects.length ?
        projects :
        process.cwd();

  console.info(text.PROJECT_NOT_FOUND, projectsWanted);
}
