var _ = require('lodash'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    utils = require('./utils'),
    WSServer = rewire('../lib/remote/ws-server');

// Mocks
var secret = 'my-secret';
var wsOnMock = sinon.spy();
var mockConfig = {
    hostname: 'coolhost',
    secret: 'valid'
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

WSServer.__set__('WebSocketServer', WebSocketServerMock);
WSServer.__set__('config', mockConfig);
WSServer.__set__('util', { log: _.noop });

describe('ws-server', function() {

    afterEach(function() {
        wsOnMock.reset();
        utils.resetSpies(_wsMock);
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
                port: port,
                secret: secret
            });
        });

        it('should register a `connection` handler', function() {
            expect(wsOnMock.getCall(0).args[0]).to.equal('connection');
            expect(wsOnMock.getCall(0).args[1]).to.be.a('function');
        });

        describe('when a client connects', function() {
            beforeEach(function() {
                // Invoke the `connection` handler
                wsOnMock.getCall(0).args[1](_wsMock);
            });

            it('should register a `message` handler', function() {
                expect(_wsMock.on.getCall(0).args[0]).to.equal('message');
                expect(_wsMock.on.getCall(0).args[1]).to.be.a('function');
            });

            it('should emit a connection-closed event when a client disconnects', function(done) {
                wsserver.on('connection-closed', function() {
                    expect(true).to.be.ok;
                    done();
                });
                _wsMock.on.getCall(1).args[1](_wsMock);
            });

            describe('and sends a `file` message', function() {
                var fileMessage = {
                    subject: 'file',
                    contents: 'some-contents',
                    secret: secret
                };
                var emittedMessage = null;

                beforeEach(function(done) {
                    // Register the file-event
                    wsserver.on('file-change', function(message) {
                        emittedMessage = message;
                        done();
                    });

                    // Invoke the handshake handler
                    _wsMock.on.getCall(0).args[1](JSON.stringify(fileMessage));
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
