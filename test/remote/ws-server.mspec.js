var _ = require('lodash'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    WSServer = rewire('../../lib/remote/ws-server');

// Mocks
var mockParams = {
    encrypt: false,
    hostname: 'coolhost',
    secret: 'valid'
};

var wsMock = {
    on: sinon.spy(),
    resetAll: function() {
        _.forIn(wsMock, function(method, key) {
            if (key !== 'resetAll') method.reset();
        });
    }
};

var WebSocketServerMock = function() {
    return wsMock;
};

WSServer.__set__('WebSocketServer', WebSocketServerMock);
WSServer.__set__('console', { log: _.noop });

describe('ws-server', function() {

    afterEach(function() {
        wsMock.resetAll();
    });

    it('should throw an error when not supplying a `params` object', function() {
        expect(WSServer).to.throw();
    });

    it('should return an event-emitter', function() {
        expect(new WSServer(mockParams).on).to.be.a('function');
    });

    describe('default behaviour', function() {
        var wsserver;

        beforeEach(function() {
            wsserver = new WSServer(mockParams);
        });

        it('should register a `connection` handler', function() {
            expect(wsMock.on.getCall(0).args[0]).to.equal('connection');
            expect(wsMock.on.getCall(0).args[1]).to.be.a('function');
        });

        describe('when a client connects', function() {
            beforeEach(function() {
                // Invoke the `connection` handler
                wsMock.on.getCall(0).args[1](wsMock);
            });

            it('should register a `message` handler', function() {
                expect(wsMock.on.getCall(1).args[0]).to.equal('message');
                expect(wsMock.on.getCall(1).args[1]).to.be.a('function');
            });

            it('should emit a connection-closed event when a client disconnects', function(done) {
                wsserver.on('connection-closed', function() {
                    expect(true).to.be.ok;
                    done();
                });
                wsMock.on.getCall(2).args[1]();
            });

            describe('when the secret does not match', function () {
                var badMessage = {
                    subject: 'file',
                    contents: 'some-contents',
                    secret: 'i dont match!'
                };

                it('should emit an `unauthorized` event', function(done) {
                    wsserver.on('unauthorized', done);

                    // Invoke the message handler
                    wsMock.on.getCall(1).args[1](JSON.stringify(badMessage));
                });
            });

            describe('and sends a `file` message', function() {
                var emittedMessage = null;
                var fileMessage = {
                    subject: 'file',
                    contents: 'some-contents',
                    secret: mockParams.secret
                };

                beforeEach(function(done) {
                    // Register the file-event
                    wsserver.on('file-change', function(message) {
                        emittedMessage = message;
                        done();
                    });

                    // Invoke the message handler
                    wsMock.on.getCall(1).args[1](JSON.stringify(fileMessage));
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
