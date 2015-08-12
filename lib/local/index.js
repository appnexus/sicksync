/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var _ = require('lodash'),
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

    var fsHelper = new FSHelper({
        sourceLocation: projectConf.sourceLocation,
        destinationLocation: projectConf.destinationLocation,
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
        bigSync(projectConf, function() {
            fsHelper.start();
            util.log(
                'connected to',
                projectConf.hostname, (config.prefersEncrypted) ? 'using' : 'not using',
                'encryption'
            );
        });
    });

    wsClient.on('reconnecting', function() {
        util.log('reconnecting to', projectConf.hostname);
    });

    wsClient.on('disconnected', function() {
        util.log('lost connection to', projectConf.hostname);
    });

    // FS events
    fsHelper.on('file-change', function(data) {
        util.log('>', data.changeType, data.filepath);
        wsClient.send(data);
    });

    fsHelper.on('large-change', function() {
        util.log('sending large change to', projectConf.hostname);
        fsHelper.pauseWatch();

        bigSync(projectConf, function() {
            util.log('large change received');
            fsHelper.unpauseWatch();
        });
    });
}

module.exports = {
    start: start
};
