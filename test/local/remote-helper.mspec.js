var expect = require('chai').expect,
  _ = require('lodash'),
  text = require('../../conf/text'),
  utilStub = require('../stubs/util'),
  proxyquire = require('proxyquire'),
  Helper = proxyquire('../../src/local/remote-helper', {
    '../util': utilStub,
  });

var params = {
  username: 'joel',
  hostname: 'myhost',
  secret: 'dirty-little-secret',
  websocketPort: 1234,
  prefersEncrypted: true,
  debug: true,
};

describe('remote-helper', function() {
  var helper = null;

  beforeEach(function() {
    helper = new Helper(params);
  });

  afterEach(function() {
    utilStub.resetAll();
  });

  describe('#start', function() {
    it('should shell into the remote box', function() {
      helper.start();
      expect(utilStub.shellIntoRemote.lastCall.args[0]).to.equal(params.username + '@' + params.hostname);
    });

    it('should listen to data coming in from the remote host', function() {
      helper.start();
      expect(utilStub._ssh.stdout.on.lastCall.args[0]).to.equal('data');
      expect(utilStub._ssh.stdout.on.lastCall.args[1]).to.be.a('function');
    });

    it('should emit a ready flag once the server starts up', function(done) {
      helper.start();
      helper.once('ready', done);
      utilStub.triggerStdout(text.SERVER_ON_READY);
    });

    it('should emit a message event if the message contains the secret', function(done) {
      var message = 'some message!';
      var event = params.secret + ' ' + message;
      helper.start();
      helper.once('message', function(data) {
        expect(data).to.contain(message);
        done();
      });
      utilStub.triggerStdout(event);
    });

    it('should emit an error event when the command isn\'t found', function(done) {
      var errorMessage = 'command not found';
      helper.start();
      helper.once('not-found', function(data) {
        expect(data).to.contain(errorMessage);
        done();
      });
      utilStub.triggerStdout(errorMessage);
    });

    it('should emit an error event when the command isn\'t in the $PATH', function(done) {
      var notInPathMessage = 'no sicksync in';
      helper.start();
      helper.once('not-found', function(data) {
        expect(data).to.contain(notInPathMessage);
        done();
      });
      utilStub.triggerStdout(notInPathMessage);
    });

    describe('starting the sicksync process', function() {
      it('should happen on the first stdout message', function(done) {
        helper.start();
        helper.once('ready', function() {
          expect(utilStub._ssh.stdin.write.called).to.be.true;
          done();
        });
        utilStub.triggerStdout(text.SERVER_ON_READY);
      });

      it('should only happen once', function(done) {
        var message = params.secret + ' some message!';
        helper.start();
        helper.once('message', function() {
          expect(utilStub._ssh.stdin.write.calledOnce).to.be.true;
          done();
        });
        utilStub.triggerStdout(text.SERVER_ON_READY);
        utilStub.triggerStdout(message);
      });

      it('should pass in the config flags when executing', function(done) {
        helper.start();
        helper.once('ready', function() {
          var remoteCmd = utilStub._ssh.stdin.write.lastCall.args[0];
          expect(remoteCmd).to.contain('-s dirty-little-secret');
          expect(remoteCmd).to.contain('-p 1234');
          done();
        });
        utilStub.triggerStdout(text.SERVER_ON_READY);
      });

      it('should exclude the `debug` and `encrypt` flags if not present in config', function(done) {
        var noDebugOrExcludeConfig = _.clone(params);

        noDebugOrExcludeConfig.debug = false;
        noDebugOrExcludeConfig.prefersEncrypted = false;

        helper = new Helper(noDebugOrExcludeConfig);
        helper.start();
        helper.once('ready', function() {
          var remoteCmd = utilStub._ssh.stdin.write.lastCall.args[0];
          expect(remoteCmd).to.not.contain('-e');
          expect(remoteCmd).to.not.contain('-d');
          done();
        });
        utilStub.triggerStdout(text.SERVER_ON_READY);
      });
    });
  });
});
