var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    testUtils = require('../utils'),
    Client = rewire('../../lib/local/ws-client');

// MOCKS
var cryptMock = {
    stringifyAndEncrypt: JSON.stringify,
    decryptAndParse: JSON.parse
};

var configMock = {
    hostname: 'somehost',
    secret: 'keepitsafe',
    retryOnDisconnect: true
};

var wsMock = {
    on: sinon.stub(),
    send: sinon.stub()
};

var WsMock = sinon.stub().returns(wsMock);

var devboxMock = {
    start: sinon.spy(),
    on: sinon.spy()
};

var DevboxMock = sinon.stub().returns(devboxMock);

var processMock = {
    exit: sinon.spy()
};

var utilMock = {
    wakeDevBox: sinon.spy(),
    getConfig: sinon.stub().returns(configMock)
};

Client.__set__('util', utilMock);
Client.__set__('crypt', cryptMock);
Client.__set__('WebSocket', WsMock);
Client.__set__('RemoteHelper', DevboxMock);
Client.__set__('process', processMock);

describe('ws-client', function() {
    var ws = null;

    beforeEach(function() {
        ws = new Client({
            url: 'ws://somewebsocket'
        });
    });

    afterEach(function() {
        processMock.exit.reset();
        devboxMock.on.reset();
        devboxMock.start.reset();
        testUtils.resetSpies(wsMock);
        utilMock.wakeDevBox.reset();
    });

    describe('connection', function() {
        it('should register callbacks via the `on` method', function() {
            expect(wsMock.on.called).to.be.true;
        });

        it('should register a callback for the `open` message', function() {
            expect(wsMock.on.getCall(0).args[0]).to.equal('open');
            expect(wsMock.on.getCall(0).args[1]).to.be.a('function');
        });

        it('should register a callback for the `close` message', function() {
            expect(wsMock.on.getCall(1).args[0]).to.equal('close');
            expect(wsMock.on.getCall(1).args[1]).to.be.a('function');
        });

        it('should register a callback for the `error` message', function() {
            expect(wsMock.on.getCall(2).args[0]).to.equal('error');
            expect(wsMock.on.getCall(2).args[1]).to.be.a('function');
        });
    });

    describe('#send', function () {
        it('should attach the secret to the passed in object', function() {
            ws.send({some: 'object'});

            expect(JSON.parse(wsMock.send.lastCall.args[0]).secret).to.not.be.a('undefined');
        });
    });

    describe('onOpen', function() {
        beforeEach(function() {
            // Trigger `open`
            wsMock.on.getCall(0).args[1]();
        });

        it('should emit a `ready` event', function(done) {
            ws.on('ready', done);
            wsMock.on.getCall(0).args[1]();
        });
    });

    describe('onClose', function() {
        beforeEach(function() {
            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
        });

        it('should emit a `disconnected` event', function(done) {
            ws.on('disconnected', done);

            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
        });

        it('should attempt to awaken the devbox after the `bigSync` call', function() {
            expect(devboxMock.start.called).to.be.true;
        });

        it('when the `retryOnDisconnect` flag is set to `false` should exit the process', function() {
            ws._config = {
                hostname: 'somehost',
                secret: 'keepitsafe',
                retryOnDisconnect: false
            };

            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
            expect(processMock.exit.called).to.be.true;
        });
    });

    describe('onError', function() {
        beforeEach(function() {
            // Trigger `error`
            wsMock.on.getCall(2).args[1]();
        });

        it('should emit an `reconnecting` event', function(done) {
            ws.on('reconnecting', done);

            // Trigger `error`
            wsMock.on.getCall(2).args[1]();
        });

        it('should start the remote devbox', function() {
            expect(devboxMock.start.called).to.be.true;
        });

        it('should listen for the `ready` message from the devbox', function() {
            expect(devboxMock.on.getCall(0).args[0]).to.equal('ready');
            expect(devboxMock.on.getCall(0).args[1]).to.be.a('function');
        });

        it('should listen for the `message` message from the devbox', function() {
            expect(devboxMock.on.getCall(1).args[0]).to.equal('message');
            expect(devboxMock.on.getCall(1).args[1]).to.be.a('function');
        });
    });

});
