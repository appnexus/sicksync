var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    events = new EventEmitter(),
    config = util.getConfig();

function startRemoteSicksync(ssh) {
    ssh.stdin.write(
        ['sicksync remote',
            '-s', config.secret,
            '-p', config.websocketPort,
            config.prefersEncrypted ? '-e': '',
            config.debug ? '-d': '',
            '\n'].join(' ')
    );
}

module.exports.start = function () {
    var bootSicksync = _.once(startRemoteSicksync);
    var ssh = util.shellIntoRemote();

    ssh.stdout.on('data', function(data) {
        var message = data.toString();

        // Boot sicksync (once!)
        bootSicksync(ssh);

        // If we get a 'ready' flag back from the server, emit a ready event
        if (_.contains(message, 'ready')) return events.emit('ready');

        // If the message contains the devboxes name, emit the message
        /* istanbul ignore else */
        if (_.contains(message, config.destinationLocation)) return events.emit('message', message);
    });

    return {
        on: events.on.bind(events),
        once: events.once.bind(events)
    };
};
