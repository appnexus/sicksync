var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    nodeUtil = require('util'),
    util = require('../util');

function RemoteHelper() {
    this._config = util.getConfig();
}

nodeUtil.inherits(RemoteHelper, EventEmitter);

RemoteHelper.prototype.startRemoteSicksync = function(ssh) {
    var context = this;

    ssh.stdin.write(
        ['sicksync remote',
            '-s', context._config.secret,
            '-p', context._config.websocketPort,
            context._config.prefersEncrypted ? '-e': '',
            context._config.debug ? '-d': '',
            '\n'].join(' ')
    );
};

RemoteHelper.prototype.start = function() {
    var context = this;
    var bootSicksync = _.once(this.startRemoteSicksync.bind(this));
    var ssh = util.shellIntoRemote();

    ssh.stdout.on('data', function(data) {
        var message = data.toString();

        // Boot sicksync (once!)
        bootSicksync(ssh);

        // If we get a 'ready' flag back from the server, emit a ready event
        if (_.contains(message, 'ready')) return context.emit('ready');

        // If the message contains the devboxes name, emit the message
        /* istanbul ignore else */
        if (_.contains(message, context._config.destinationLocation)) return context.emit('message', message);
    });
};

module.exports = RemoteHelper;
