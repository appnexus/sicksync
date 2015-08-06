var _ = require('lodash'),
    spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter,
    util = require('../util'),
    events = new EventEmitter(),
    config = util.getConfig(),
    sicksyncCalled = false;

function startRemoteSicksync(ssh) {
    sicksyncCalled = true;
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
    var sicksyncOnce = _.once(startRemoteSicksync);
    var ssh = spawn('ssh',[
        '-tt',
        config.userName + '@' + config.hostname
    ]);

    ssh.stdout.on('data', function(data) {
        var message = data.toString();

        // If we get a 'ready' flag back from the server, emit a ready event
        if (_.contains(message, 'ready')) return events.emit('ready');

        // If the message contains the devboxes name, emit the message
        if (_.contains(message, config.destinationLocation)) return events.emit('message', data.toString());

        // Boot sicksync (once!)
        sicksyncOnce(ssh);
    });

    return {
        on: events.on.bind(events)
    };
};
