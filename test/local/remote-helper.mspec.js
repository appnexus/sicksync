var expect = require('chai').expect,
    _ = require('lodash'),
    sinon = require('sinon'),
    rewire = require('rewire'),
    text = require('../../conf/text'),
    Helper = rewire('../../src/local/remote-helper');

var sshMock = {
    stdout: {
        on: sinon.spy()
    },
    stdin: {
        write: sinon.spy()
    }
};

var utilMock = {
    getConfig: sinon.spy(),
    shellIntoRemote: sinon.stub().returns(sshMock),
    resetAll: function () {
        _.forIn(utilMock, function(method, key) {
            if (key !== 'resetAll') method.reset();
        });
    }
};

var params = {
    username: 'joel',
    hostname: 'myhost',
    secret: 'dirty-little-secret',
    websocketPort: 1234,
    prefersEncrypted: true,
    debug: true
};

function triggerStdout(message) {
    sshMock.stdout.on.lastCall.args[1](new Buffer(message));
}

describe('remote-helper', function () {
    var helper = null;
    var utilCache = Helper.__get__('util');

    beforeEach(function () {
        Helper.__set__('util', utilMock);
        helper = new Helper(params);
    });

    afterEach(function() {
        Helper.__set__('util', utilCache);
        sshMock.stdout.on.reset();
        sshMock.stdin.write.reset();
        utilMock.resetAll();
    });

    describe('#start', function () {
        it('should shell into the remote box', function() {
            helper.start();
            expect(utilMock.shellIntoRemote.lastCall.args[0]).to.equal(params.username + '@' + params.hostname);
        });

        it('should listen to data coming in from the remote host', function() {
            helper.start();
            expect(sshMock.stdout.on.lastCall.args[0]).to.equal('data');
            expect(sshMock.stdout.on.lastCall.args[1]).to.be.a('function');
        });

        it('should emit a ready flag once the server starts up', function(done) {
            helper.start();
            helper.once('ready', done);
            triggerStdout(text.SERVER_ON_READY);
        });

        it('should emit a message event if the message contains the secret', function(done) {
            var message = 'some message!';
            var event = params.secret + ' ' + message;
            helper.start();
            helper.once('message', function(data) {
                expect(data).to.contain(message);
                done();
            });
            triggerStdout(event);
        });

        it('should emit an error event when the command isn\'t found', function(done) {
            var errorMessage = 'command not found';
            helper.start();
            helper.once('error', function(data) {
                expect(data).to.contain(errorMessage);
                done();
            });
            triggerStdout(errorMessage);

        });

        describe('starting the sicksync process', function () {
            it('should happen on the first stdout message', function(done) {
                helper.start();
                helper.once('ready', function() {
                    expect(sshMock.stdin.write.called).to.be.true;
                    done();
                });
                triggerStdout(text.SERVER_ON_READY);
            });

            it('should only happen once', function(done) {
                var message = params.secret + ' some message!';
                helper.start();
                helper.once('message', function() {
                    expect(sshMock.stdin.write.calledOnce).to.be.true;
                    done();
                });
                triggerStdout(text.SERVER_ON_READY);
                triggerStdout(message);
            });

            it('should pass in the config flags when executing', function(done) {
                helper.start();
                helper.once('ready', function() {
                    var remoteCmd = sshMock.stdin.write.lastCall.args[0];
                    expect(remoteCmd).to.contain('-s dirty-little-secret');
                    expect(remoteCmd).to.contain('-p 1234');
                    done();
                });
                triggerStdout(text.SERVER_ON_READY);
            });

            it('should exclude the `debug` and `encrypt` flags if not present in config', function(done) {
                var noDebugOrExcludeConfig = _.clone(params);
                
                noDebugOrExcludeConfig.debug = false;
                noDebugOrExcludeConfig.prefersEncrypted = false;
                
                helper = new Helper(noDebugOrExcludeConfig);
                helper.start();
                helper.once('ready', function() {
                    var remoteCmd = sshMock.stdin.write.lastCall.args[0];
                    expect(remoteCmd).to.not.contain('-e');
                    expect(remoteCmd).to.not.contain('-d');
                    done();
                });
                triggerStdout(text.SERVER_ON_READY);
            });
        });
    });
});
