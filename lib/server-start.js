var spawn = require('child_process').spawn,
    util = require('./util'),
    config = require(util.getConfigPath()),
    server = spawn('ssh', [config.userName + '@' + config.hostname, '"sicksync-remote"']);

server.stdout.pipe(process.stdout);

server.on('close', function (code) {
    console.log('[' + config.hostname + '] Closed: ' + code);
});

server.stdout.on('data', function(buf) {
    if (buf.toString().indexOf('up and waiting') > -1) process.send(buf);
});