var _ = require('lodash'),
    sinon = require('sinon');

var sshApi = {
    stdout: {
        on: sinon.spy()
    },
    stdin: {
        write: sinon.spy()
    }
};

var api = {
    getConfig: sinon.stub().returns(_config),
    shellIntoRemote: sinon.stub.returns(sshApi)
};

function triggerStdout(message) {
    sshApi.stdout.on.lastCall.args[1](new Buffer(message));
};

function resetAll() {
    sshApi.stdout.on.reset();
    sshApi.stdin.write.reset();

    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

module.exports = api;
module.exports.triggerStdout = triggerStdout;
module.exports.resetAll = resetAll;
