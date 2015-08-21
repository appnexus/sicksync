/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
import _ from 'lodash';
import os from 'os';
import constants from '../../conf/constants';
import text from '../../conf/text';
import eventsConf from '../../conf/events';
import util from '../util';
import FS from './fs-helper';
import WS from './ws-client';
import bigSync from '../big-sync';

let wsEvents = eventsConf.WS.LOCAL,
    fsEvents = eventsConf.FS.LOCAL,
    hostname = os.hostname(),
    FSHelper = util.uniqInstance(constants.FS_TOKEN, FS),
    WebSocketClient = util.uniqInstance(constants.WS_TOKEN, WS),
    console = console,
    process = process;

function triggerBigSync(project, params, cb) {
    bigSync({
        project: project.project,
        excludes: project.excludes,
        sourceLocation: util.ensureTrailingSlash(project.sourceLocation),
        destinationLocation: util.ensureTrailingSlash(project.destinationLocation),
        hostname: project.hostname,
        username: project.username
    }, params, cb);
}

function start(projects, opts, config) {
    _.each(projects, function(project) {
        if (_.isEmpty(config.projects[project])) {
            return console.log(text.PROJECT_NOT_FOUND, project);
        }
        startProject(project, config);
    });
}

function startProject (project, config) {
    let projectConf = config.projects[project];
    let localLog = util.generateLog(projectConf.project, hostname);
    let remoteLog = util.generateLog(projectConf.project, projectConf.hostname);
    let sourceLocation = util.ensureTrailingSlash(projectConf.sourceLocation);
    let destinationLocation = util.ensureTrailingSlash(projectConf.destinationLocation);
    let secret = util.getId();

    let fsHelper = new FSHelper({
        sourceLocation: sourceLocation,
        excludes: projectConf.excludes,
        followSymlinks: projectConf.followSymlinks
    });

    let wsClient = new WebSocketClient({
        username: projectConf.username,
        hostname: projectConf.hostname,
        websocketPort: projectConf.websocketPort,
        secret: secret,
        prefersEncrypted: projectConf.prefersEncrypted,
        retryOnDisconnect: config.retryOnDisconnect
    });

    // WS events
    wsClient.on(wsEvents.READY, function() {
        triggerBigSync(projectConf, { debug: config.debug }, function() {
            fsHelper.watch();

            localLog(
                text.SYNC_ON_CONNECT,
                projectConf.hostname, (projectConf.prefersEncrypted) ? 'using' : 'not using',
                'encryption'
            );
        });
    });

    wsClient.on(wsEvents.RECONNECTING, _.partial(_.ary(localLog, 1), text.SYNC_ON_RECONNECT));

    wsClient.on(wsEvents.DISCONNECTED, function() {
        localLog(text.SYNC_ON_DISCONNECT);
        process.exit();
    });

    wsClient.on(wsEvents.REMOTE_ERROR, function(err) {
        localLog(text.SYNC_ON_REMOTE_LOST, err);
        process.exit();
    });

    wsClient.on(wsEvents.REMOTE_MESSAGE, function(message) {
        // Since WS can be shared amongst projects, filter out
        // any that are not in this project
        if (_.contains(message, destinationLocation)) {
            remoteLog(message);
        }
    });

    // FS events
    fsHelper.on(fsEvents.CHANGE, function(fileChange) {
        fileChange.destinationpath = destinationLocation + fileChange.relativepath;
        fileChange.subject = 'file';

        localLog('>', fileChange.changeType, fileChange.localpath);
        
        wsClient.send(fileChange);
    });

    fsHelper.on(fsEvents.LARGE, function() {
        localLog(text.SYNC_ON_LARGE_CHANGE);
        fsHelper.pauseWatch();

        triggerBigSync(projectConf, { debug: config.debug }, function() {
            localLog(text.SYNC_ON_LARGE_CHANGE_DONE);
            fsHelper.watch();
        });
    });
}

function once(projects, opts, config) {
    _.each(projects, function(project) {
        if (_.isEmpty(config.projects[project])) {
            return console.log(text.PROJECT_NOT_FOUND, project);
        }
        let projectConf = config.projects[project];
        let localLog = util.generateLog(projectConf.project, hostname);
        
        localLog(text.SYNC_ON_ONCE);

        triggerBigSync(projectConf, {
            dry: opts.dryRun,
            debug: config.debug
        }, _.partial(localLog, text.SYNC_ON_ONCE_DONE));
    });
}

export default { start, once };
