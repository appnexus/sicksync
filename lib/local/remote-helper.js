var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    nodeUtil = require('util'),
    util = require('../util'),
    remoteEvents = require('../../conf/events').REMOTE,
    readyFlag = require('../../conf/text').SERVER_ON_READY;

function RemoteHelper(params) {
    this._secret = params.secret;
    this._webSocketPort = params.websocketPort;
    this._username = params.username;
    this._hostname = params.hostname;
    this._projectname = params.projectname;
    this._prefersEncrypted = params.prefersEncrypted || false;
    this._debug = params.debug || true;
}

nodeUtil.inherits(RemoteHelper, EventEmitter);

RemoteHelper.prototype._startRemoteSicksync = function(ssh) {
    var context = this;

    ssh.stdin.write(
        ['sicksync remote',
            '-s', context._secret,
            '-p', context._webSocketPort,
            context._prefersEncrypted ? '-e': '',
            context._debug ? '-d': '',
            '\n'].join(' ')
    );
};

RemoteHelper.prototype.start = function() {
    var context = this;
    var bootSicksync = _.once(this._startRemoteSicksync.bind(this));
    var ssh = util.shellIntoRemote(this._username + '@' + this._hostname);

    ssh.stdout.on('data', function(data) {
        var message = data.toString();

        // Boot sicksync (once!)
        bootSicksync(ssh);

        // If we get a 'ready' flag back from the server, emit a ready event
        if (_.contains(message, readyFlag)) return context.emit(remoteEvents.READY);

        // If the message contains the devboxes name, emit the message
        /* istanbul ignore else */
        if (_.contains(message, context._secret)) {
            var cleanedMessage = message.replace(context._secret, '').replace('\n', '');

            return context.emit(remoteEvents.MESSAGE, cleanedMessage);
        }

        // Command not found :(
        if (_.contains(message, 'command not found')) {
            return context.emit(remoteEvents.ERROR, message);
        }
    });
};

module.exports = RemoteHelper;
