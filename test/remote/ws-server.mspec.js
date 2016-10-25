import { expect } from 'chai';
import proxyquire from 'proxyquire';

// Stubs
import wsStub from '../stubs/ws';
import consoleStub from '../stubs/console';

// Inject
const WSServer = proxyquire('../../src/remote/ws-server', { ws: wsStub }).default;

// Mocks
const testParams = {
  encrypt: false,
  hostname: 'coolhost',
  secret: 'valid',
};

describe('ws-server', function() {
  before(function() {
    consoleStub.inject();
  });

  after(function() {
    consoleStub.restore();
  });

  afterEach(function() {
    wsStub.resetAll();
    consoleStub.resetAll();
  });

  it('should throw an error when not supplying a `params` object', function() {
    expect(WSServer).to.throw();
  });

  describe('default behaviour', function() {
    let wsserver;

    beforeEach(function() {
      wsserver = new WSServer(testParams);
    });

    it('should register a `connection` handler', function() {
      expect(wsStub._api.on.getCall(0).args[0]).to.equal('connection');
      expect(wsStub._api.on.getCall(0).args[1]).to.be.a('function');
    });

    describe('when a client connects', function() {
      beforeEach(function() {
        // Invoke the `connection` handler
        wsStub._api.on.getCall(0).args[1](wsStub._api);
      });

      it('should register a `message` handler', function() {
        expect(wsStub._api.on.getCall(1).args[0]).to.equal('message');
        expect(wsStub._api.on.getCall(1).args[1]).to.be.a('function');
      });

      it('should emit a connection-closed event when a client disconnects', function(done) {
        wsserver.on('connection-closed', function() {
          expect(true).to.be.ok;
          done();
        });
        wsStub._api.on.getCall(2).args[1]();
      });

      describe('when the secret does not match', function() {
        const badMessage = {
          subject: 'file',
          contents: 'some-contents',
          secret: 'i dont match!',
        };

        it('should emit an `unauthorized` event', function(done) {
          wsserver.on('unauthorized', done);

          // Invoke the message handler
          wsStub._api.on.getCall(1).args[1](JSON.stringify(badMessage));
        });
      });

      describe('and sends a `file` message', function() {
        let emittedMessage = null;
        const fileMessage = {
          subject: 'file',
          contents: 'some-contents',
          secret: testParams.secret,
        };

        beforeEach(function(done) {
          // Register the file-event
          wsserver.on('file-change', function(message) {
            emittedMessage = message;
            done();
          });

          // Invoke the message handler
          wsStub._api.on.getCall(1).args[1](JSON.stringify(fileMessage));
        });

        afterEach(function() {
          emittedMessage = null;
        });

        it('should emit the file event with the message', function() {
          expect(emittedMessage).to.eql(fileMessage);
        });
      });
    });
  });
});
