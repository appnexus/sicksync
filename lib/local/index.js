/**
 *  Client
 *
 *  Entry point into the client portion of sicksync
 */
var WebSocketClient = require('./ws-client'),
    fsHelper = require('./fs-helper'),
    util = require('../util'),
    bigSync = require('../big-sync'),
    config = util.getConfig(),
    wsClient = new WebSocketClient({
        url: 'ws://' + config.hostname + ':' + config.websocketPort
    });

module.exports = function startLocal(/* cmd */) {
    // WS events
    wsClient.on('ready', function() {
        bigSync(function () {
            fsHelper.start();
            util.log('connected to',
                config.hostname,
                (config.prefersEncrypted) ? 'using': 'not using',
                'encryption');
        });
    });
    
    wsClient.on('reconnecting', function() {
        util.log('reconnecting to', config.hostname);
    });
    
    wsClient.on('disconnected', function() {
        util.log('lost connection to', config.hostname);
    });

    // FS events
    fsHelper.on('file-change', function(data) {
        util.log('>', data.changeType, data.filepath);
        wsClient.send(data);
    });

    fsHelper.on('large-change', function() {
        util.log('sending large change to', config.hostname);
        fsHelper.pauseWatch();

        bigSync(function() {
            util.log('large change received');
            fsHelper.unpauseWatch();
        });
    });
};
