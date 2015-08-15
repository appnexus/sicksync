/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var _ = require('lodash'),
    hostname = require('os').hostname(),
    constants = require('../../conf/constants'),
    text = require('../../conf/text'),
    eventsConf = require('../../conf/events'),
    util = require('../util'),
    FSHelper = util.uniqInstance(constants.FS_TOKEN, require('./fs-helper')),
    WebSocketClient = util.uniqInstance(constants.WS_TOKEN, require('./ws-client')),
    bigSync = require('../big-sync'),
    wsEvents = eventsConf.WS.LOCAL,
    fsEvents = eventsConf.FS.LOCAL;

function start(projects, config) {
    _.each(projects, function(project) {
        startProject(project, config);
    });
}

function startProject (project, config) {
    var projectConf = config.projects[project];
    var localLog = util.generateLog(projectConf.project, hostname);
    var remoteLog = util.generateLog(projectConf.project, projectConf.hostname);

    var fsHelper = new FSHelper({
        sourceLocation: projectConf.sourceLocation,
        excludes: projectConf.excludes,
        followSymlinks: projectConf.followSymlinks
    });

    var wsClient = new WebSocketClient({
        username: projectConf.username,
        hostname: projectConf.hostname,
        websocketPort: projectConf.websocketPort,
        secret: config.secret,
        prefersEncrypted: config.prefersEncrypted,
        retryOnDisconnect: config.retryOnDisconnect
    });

    // WS events
    wsClient.on(wsEvents.READY, function() {
        bigSync(projectConf, { debug: config.debug }, function() {
            fsHelper.watch();
            localLog(
                text.SYNC_ON_CONNECT,
                projectConf.hostname, (config.prefersEncrypted) ? 'using' : 'not using',
                'encryption'
            );
        });
    });

    wsClient.on(wsEvents.RECONNECTING, _.partial(localLog, text.SYNC_ON_RECONNECT));

    wsClient.on(wsEvents.DISCONNECTED, _.partial(localLog, text.SYNC_ON_DISCONNECT));

    wsClient.on(wsEvents.REMOTE_ERROR, function(err) {
        localLog(text.SYNC_ON_REMOTE_LOST, err);
        process.exit();
    });

    wsClient.on(wsEvents.REMOTE_MESSAGE, function(message) {
        // Since WS can be shared amongst projects, filter out
        // any that are not in this project
        if (_.contains(message, projectConf.destinationLocation)) {
            remoteLog(message);
        }
    });

    // FS events
    fsHelper.on(fsEvents.CHANGE, function(data) {
        data.filepath = data.sourcepath.replace(projectConf.sourceLocation, projectConf.destinationLocation);
        localLog('>', data.changeType, data.sourcepath);
        wsClient.send(data);
    });

    fsHelper.on(fsEvents.LARGE, function() {
        localLog(text.SYNC_ON_LARGE_CHANGE);
        fsHelper.pauseWatch();

        bigSync(projectConf, { debug: config.debug }, function() {
        localLog(text.SYNC_ON_LARGE_CHANGE_DONE);
            fsHelper.watch();
        });
    });
}

module.exports = {
    start: start
};
