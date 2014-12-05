var rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    utils = require('./utils'),
    WSServer = rewire('../lib/ws-server');

// Mocks
var consoleMock = sinon.spy();
var wsOnMock = sinon.spy();
var mockConfig = {
    hostname: 'coolhost',
    secret: 'valid'
};
var processSpy = {
    exit: sinon.spy()
};
var _wsMock = {
    on: sinon.spy(),
    close: sinon.spy(),
    send: sinon.spy()
};
var WebSocketServerMock = function() {
    return {
        on: wsOnMock
    };
};

WSServer.__set__('process', processSpy);
WSServer.__set__('WebSocketServer', WebSocketServerMock);
WSServer.__set__('console', { log: consoleMock });
WSServer.__set__('config', mockConfig);

describe('ws-server', function() {

    afterEach(function() {
        wsOnMock.reset();
        consoleMock.reset();
        utils.resetSpies(_wsMock);
        utils.resetSpies(processSpy);
    });

    it('should throw an error when not supplying a `params` object', function() {
        expect(WSServer).to.throw();
    });

    it('should return an `on` method', function() {
        expect(new WSServer({
            port: 2001
        }).on).to.be.a('function');
    });

    describe('default behaviour', function() {
        var wsserver;
        var port = 2001;

        beforeEach(function() {
            wsserver = new WSServer({
                port: port
            });
        });

        it('should register a `connection` handler', function() {
            expect(wsOnMock.getCall(0).args[0]).to.equal('connection');
        });

        it('should pass in a function for the `connection` handler', function() {
            expect(wsOnMock.getCall(0).args[1]).to.be.a('function');
        });

        it('should log that the server is up', function() {
            expect(consoleMock.called).to.be.true();
        });

        describe('when a client connects', function() {
            beforeEach(function() {
                // Invoke the `connection` handler
                wsOnMock.getCall(0).args[1](_wsMock);
            });

            it('should register a `message` handler', function() {
                expect(_wsMock.on.getCall(0).args[0]).to.equal('message');
            });

            it('should pass in a function for the handler', function() {
                expect(_wsMock.on.getCall(0).args[1]).to.be.a('function');
            });

            describe('and sends an invalid message', function() {
                beforeEach(function() {
                    var invalidHandshake = JSON.stringify({
                        subject: 'bad-subject'
                    });

                    // Trigger Message Handler
                    _wsMock.on.getCall(0).args[1](invalidHandshake);
                });

                it('should kill the process', function() {
                    expect(processSpy.exit.called).to.be.true();
                });

                it('should log the message', function() {
                    expect(consoleMock.getCall(1).args[0]).to.contain('closing');
                });
            });

            describe('and sends a `file` message before handshaking', function() {
                beforeEach(function() {
                    var invalidHandshake = JSON.stringify({
                        subject: 'file'
                    });

                    // Invoke the handshake handler
                    _wsMock.on.getCall(0).args[1](invalidHandshake);
                });

                it('should kill the process', function() {
                    expect(processSpy.exit.called).to.be.true();
                });

                it('should log the message', function() {
                    expect(consoleMock.getCall(1).args[0]).to.contain('closing');
                });
            });

            describe('and an invalid handshake', function() {
                beforeEach(function() {
                    var invalidHandshake = JSON.stringify({
                        token: 'I\'m a bad client',
                        subject: 'handshake'
                    });

                    // Invoke the handshake handler
                    _wsMock.on.getCall(0).args[1](invalidHandshake);
                });

                it('should close the connection', function() {
                    expect(_wsMock.close.called).to.be.true();
                });
            });

            describe('and sends a valid handshake', function() {
                beforeEach(function() {
                    var invalidHandshake = JSON.stringify({
                        token: mockConfig.secret,
                        subject: 'handshake'
                    });

                    // Invoke the handshake handler
                    _wsMock.on.getCall(0).args[1](invalidHandshake);
                });

                it('should send a response back', function() {
                    expect(_wsMock.send.called).to.be.true();
                });

                it('should contain a `subject` of `handshake`', function() {
                    var handshakeRes = _wsMock.send.getCall(0).args;
                    expect(JSON.parse(handshakeRes).subject).to.equal('handshake');
                });

                it('should contain an `isAllowed` parameter of `true`', function() {
                    var handshakeRes = _wsMock.send.getCall(0).args;
                    expect(JSON.parse(handshakeRes).isAllowed).to.be.true();
                });
            });

            describe('and sends a `file` message after handshaking', function() {
                var fileMessageEmitted = null;

                beforeEach(function(done) {
                    var invalidHandshake = JSON.stringify({
                        token: mockConfig.secret,
                        subject: 'handshake'
                    });
                    var fileMessage = JSON.stringify({
                        subject: 'file',
                        contents: 'some-contents'
                    });
                    // Register the file-event
                    wsserver.on('file-change', function(message) {
                        fileMessageEmitted = message;
                        done();
                    });
                    // Invoke the handshake handler
                    _wsMock.on.getCall(0).args[1](invalidHandshake);
                    _wsMock.on.getCall(0).args[1](fileMessage);
                });

                it('should emit file event', function() {
                    expect(fileMessageEmitted).not.to.be.a('null');
                });
            });
        });
    });
});