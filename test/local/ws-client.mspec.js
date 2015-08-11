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

var wsMock = {
    on: sinon.stub(),
    send: sinon.stub()
};

var WsMock = sinon.stub().returns(wsMock);

var utilMock = {
    wakeDevBox: sinon.spy()
};

var configMock = {
    hostname: 'somehost',
    secret: 'keepitsafe',
    retryOnDisconnect: true
};

var bigSyncMock = sinon.spy();

Client.__set__('config', configMock);
Client.__set__('util', utilMock);
Client.__set__('crypt', cryptMock);
Client.__set__('WebSocket', WsMock);
Client.__set__('bigSync', bigSyncMock);

describe('ws-client', function() {

    afterEach(function() {
        testUtils.resetSpies(wsMock);
        utilMock.wakeDevBox.reset();
        bigSyncMock.reset();
    });

    describe('connection', function() {
        var ws = null;

        beforeEach(function() {
            ws = new Client({
                url: 'ws://somewebsocket'
            });
        });

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

    describe('onOpen', function() {
        var ws = null;

        beforeEach(function() {
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `open`
            wsMock.on.getCall(0).args[1]();
        });

        it('should emit a `ready` event', function(done) {
            ws.on('ready', done);
            wsMock.on.getCall(0).args[1]();
        });
    });

    describe('onClose', function() {
        var ws = null;
        var oldProcess = Client.__get__('process');
        var remoteHelper = Client.__get__('remoteHelper');
        var devboxMock = {
            start: sinon.stub().returns({
                on: sinon.spy()
            })
        };
        var processMock = {
            exit: sinon.spy(),
            on: sinon.spy()
        };

        beforeEach(function() {
            Client.__set__('remoteHelper', devboxMock);
            Client.__set__('process', processMock);
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
        });

        afterEach(function() {
            processMock.exit.reset();
            devboxMock.start().on.reset();
            devboxMock.start.reset();
            Client.__set__('process', oldProcess);
            Client.__set__('remoteHelper', remoteHelper);
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
            Client.__set__('config', {
                hostname: 'somehost',
                secret: 'keepitsafe',
                retryOnDisconnect: false
            });

            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
            expect(processMock.exit.called).to.be.true;
        });
    });

    describe('onError', function() {
        var ws = null;
        var oldProcess = Client.__get__('process');
        var remoteHelper = Client.__get__('remoteHelper');
        var devboxMock = {
            start: sinon.stub().returns({
                on: sinon.spy()
            })
        };
        var processMock = {
            exit: sinon.spy(),
            on: sinon.spy()
        };

        beforeEach(function() {
            Client.__set__('remoteHelper', devboxMock);
            Client.__set__('process', processMock);
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `error`
            wsMock.on.getCall(2).args[1]();
        });

        afterEach(function() {
            processMock.exit.reset();
            Client.__set__('process', oldProcess);
            Client.__set__('remoteHelper', remoteHelper);
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
            expect(devboxMock.start().on.getCall(0).args[0]).to.equal('ready');
            expect(devboxMock.start().on.getCall(0).args[1]).to.be.a('function');
        });

        it('should listen for the `message` message from the devbox', function() {
            expect(devboxMock.start().on.getCall(1).args[0]).to.equal('message');
            expect(devboxMock.start().on.getCall(1).args[1]).to.be.a('function');
        });
    });

});
