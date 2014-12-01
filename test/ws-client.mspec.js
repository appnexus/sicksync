var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    testUtils = require('./utils'),
    Client = rewire('../lib/ws-client');

// MOCKS
var cryptMock = {
    stringifyAndEncrypt: JSON.stringify,
    decryptAndParse: JSON.parse
};

var wsMock = {
    on: sinon.stub(),
    send: sinon.stub()
};

var WsMock = sinon.stub().returns(wsMock);

Client.__set__('crypt', cryptMock);
Client.__set__('WebSocket', WsMock);

describe('ws-client', function() {

    afterEach(function() {
        testUtils.resetSpies(wsMock);
    });

    describe('connection', function() {
        var ws = null;

        beforeEach(function() {
            ws = new Client({
                url: 'ws://somewebsocket'
            });
        });

        it('should register callbacks via the `on` method', function() {
            expect(wsMock.on.called).to.be.true();
        });

        it('should register a callback for the `open` message', function() {
            expect(wsMock.on.getCall(0).args[0]).to.equal('open');
            expect(wsMock.on.getCall(0).args[1]).to.be.a('function');
        });

        it('should register a callback for the `message` message', function() {
            expect(wsMock.on.getCall(1).args[0]).to.equal('message');
            expect(wsMock.on.getCall(1).args[1]).to.be.a('function');
        });

        it('should register a callback for the `close` message', function() {
            expect(wsMock.on.getCall(2).args[0]).to.equal('close');
            expect(wsMock.on.getCall(2).args[1]).to.be.a('function');
        });

        it('should register a callback for the `error` message', function() {
            expect(wsMock.on.getCall(3).args[0]).to.equal('error');
            expect(wsMock.on.getCall(3).args[1]).to.be.a('function');
        });
    });

    describe('handshake', function() {
        var ws = null;

        beforeEach(function() {
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `open`
            wsMock.on.getCall(0).args[1]();
        });

        it('should send a message to the web-socket', function() {
            expect(wsMock.send.called).to.be.true();
        });

        it('should send a `subject` and `token` property in the payload', function() {
            var sendCall = JSON.parse(wsMock.send.getCall(0).args[0]);

            expect(sendCall.subject).to.equal('handshake');
            expect(sendCall.token).to.be.a('string');
        });
    });
});