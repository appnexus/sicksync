var expect = require('chai').expect,
    sinon = require('sinon'),
    rewire = require('rewire'),
    testUtils = require('../utils'),
    Helper = rewire('../../lib/local/remote-helper');

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
    shellIntoRemote: sinon.stub().returns(sshMock)
};

var configMock = {
    secret: 'dirty-little-secret',
    websocketPort: 1234,
    prefersEncrypted: false,
    debug: false,
    destinationLocation: 'my-dev-box'
};

function triggerStdout(message) {
    sshMock.stdout.on.lastCall.args[1](new Buffer(message));
}

describe('remote-helper', function () {
    var helper = null;
    var utilCache = Helper.__get__('util');

    beforeEach(function () {
        Helper.__set__('util', utilMock);
        helper = new Helper(configMock);
    });

    afterEach(function() {
        Helper.__set__('util', utilCache);
        sshMock.stdout.on.reset();
        sshMock.stdin.write.reset();
        testUtils.resetSpies(utilMock);
    });

    describe('#start', function () {
        it('should shell into the remote box', function() {
            helper.start();
            expect(utilMock.shellIntoRemote.called).to.be.true;
        });

        it('should listen to data coming in from the remote host', function() {
            helper.start();
            expect(sshMock.stdout.on.lastCall.args[0]).to.equal('data');
            expect(sshMock.stdout.on.lastCall.args[1]).to.be.a('function');
        });

        it('should emit a ready flag once the server starts up', function(done) {
            helper.start();
            helper.once('ready', done);
            triggerStdout('ready');
        });

        it('should emit a message event if the message contains the devbox name', function(done) {
            var message = configMock.destinationLocation + ' some message!';
            helper.start();
            helper.once('message', function(data) {
                expect(data).to.equal(message);
                done();
            });
            triggerStdout(message);
        });

        describe('starting the sicksync process', function () {
            it('should happen on the first stdout message', function(done) {
                helper.start();
                helper.once('ready', function() {
                    expect(sshMock.stdin.write.called).to.be.true;
                    done();
                });
                triggerStdout('ready');
            });

            it('should only happen once', function(done) {
                var message = configMock.destinationLocation + ' some message!';
                helper.start();
                helper.once('message', function() {
                    expect(sshMock.stdin.write.calledOnce).to.be.true;
                    done();
                });
                triggerStdout('ready');
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
                triggerStdout('ready');
            });

            it('should exclude the `debug` and `encrypt` flags if not present in config', function(done) {
                helper._config.debug = true;
                helper._config.prefersEncrypted = true;
                helper.start();
                helper.once('ready', function() {
                    var remoteCmd = sshMock.stdin.write.lastCall.args[0];
                    expect(remoteCmd).to.contain('-e');
                    expect(remoteCmd).to.contain('-d');
                    done();
                });
                triggerStdout('ready');
            });
        });
    });
});
