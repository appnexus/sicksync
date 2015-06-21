var forever = require('forever');

var childFilePath = './lib/remote-daemon.js';

var child = forever.startDaemon(
	childFilePath,
	{
		'logFile': 'remote-daemon.log',
        'outFile': 'remote-daemon-stdout.log',
        'errFile': 'remote-daemon-stderr.log',
    	'max': 2, // maximum times to start the child process (it auto restarts FYI)
		'uid': 'myChildProces'
	}
);

child.on('start', function() {
	console.log('Forever starting script');
});

child.on('restart', function() {
    console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('stop', function() {
	console.log('Forever script has stopped');
});

// triggered by process.exit(), called after exit:code callback if exit code present
child.on('exit', function() {
	console.log('Forever script has exited');
});

// triggered by process.exit(<code>)
child.on('exit:code', function(code) {
    console.error('Forever detected script exited with code ' + code);
});

// I cannot make this trigger :(
child.on('error', function(err) {
	console.error("Received an error: " + err);
});

// triggered by console.log
child.on('stdout', function(data) {
	console.log("STDOUT");
	console.log(data);
});

// triggered by console.error
child.on('stderr', function(data) {
	console.log("STDERR");
	console.log(data);
});

var server = forever.startServer(child);