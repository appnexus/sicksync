/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var _ = require('lodash'),
    hostname = require('os').hostname(),
    constants = require('../../conf/constants'),
    util = require('../util'),
    FSHelper = util.uniqInstance(constants.FS_TOKEN, require('./fs-helper')),
    WebSocketClient = util.uniqInstance(constants.WS_TOKEN, require('./ws-client')),
    bigSync = require('../big-sync');

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
    wsClient.on('ready', function() {
        bigSync(projectConf, { debug: config.debug }, function() {
            fsHelper.start();
            localLog(
                'connected to',
                projectConf.hostname, (config.prefersEncrypted) ? 'using' : 'not using',
                'encryption'
            );
        });
    });

    wsClient.on('reconnecting', function() {
        localLog('reconnecting to', projectConf.hostname);
    });

    wsClient.on('disconnected', function() {
        localLog('lost connection to', projectConf.hostname);
    });

    wsClient.on('remote-message', function(message) {
        // Since WS can be shared amongst projects, filter out
        // any that are not in this project
        if (_.contains(message, projectConf.destinationLocation)) {
            remoteLog(message);
        }
    });

    // FS events
    fsHelper.on('file-change', function(data) {
        data.filepath = data.sourcepath.replace(projectConf.sourceLocation, projectConf.destinationLocation);
        localLog('>', data.changeType, data.sourcepath);
        wsClient.send(data);
    });

    fsHelper.on('large-change', function() {
        localLog('sending large change to', projectConf.hostname);
        fsHelper.pauseWatch();

        bigSync(projectConf, { debug: config.debug }, function() {
            localLog('large change received');
            fsHelper.unpauseWatch();
        });
    });
}

module.exports = {
    start: start
};
