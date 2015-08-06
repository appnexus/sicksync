var exec = require('child_process').exec,
    util = require('../lib/util'),
    config = util.getConfig(),
    sicksyncCommand = [
        'sicksync remote',
            '-s', config.secret,
            '-p', config.websocketPort,
            config.prefersEncrypted ? '-e': '',
            config.debug ? '-d': '',
    ].join(' '),
    serverStartCommand = [
        'ssh', config.userName + '@' + config.hostname,
        '"' + sicksyncCommand + '"'
    ].join(' ');

var devbox = exec(serverStartCommand);

devbox.on('data', function(data) {
    console.log(data);
});

devbox.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

devbox.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

devbox.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});
