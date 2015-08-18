var expect = require('chai').expect,
    _ = require('lodash'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    Client = rewire('../../lib/local/ws-client');

var params = {
    secret: 'keepitsafe',
    prefersEncrypted: false,
    retryOnDisconnect: true,
    hostname: 'somehost',
    websocketPort: 1234,
    username: 'joel'
};

var wsMock = {
    on: sinon.stub(),
    send: sinon.stub(),
    resetAll: function() {
        _.forIn(wsMock, function(method, key) {
            if (key !== 'resetAll') method.reset();
        });
    }
};

var WsMock = sinon.stub().returns(wsMock);

var devboxMock = {
    start: sinon.spy(),
    on: sinon.spy()
};

var DevboxMock = sinon.stub().returns(devboxMock);

Client.__set__('WebSocket', WsMock);
Client.__set__('RemoteHelper', DevboxMock);

describe('ws-client', function() {
    var ws = null;

    beforeEach(function() {
        ws = new Client(params);
    });

    afterEach(function() {
        devboxMock.on.reset();
        devboxMock.start.reset();
        wsMock.resetAll();
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

        it('should attempt to awaken the devbox after the `bigSync` call', function() {
            expect(devboxMock.start.called).to.be.true;
        });
        
        it('should emit a `disconnected` event when `retryOnDisconnect` is false', function(done) {
            wsMock.on.reset();
            var noRetryParams = _.clone(params);
            noRetryParams.retryOnDisconnect = false;

            var wsNoRetry = new Client(noRetryParams);
            wsNoRetry.once('disconnected', done);

            // Trigger `close`
            wsMock.on.getCall(1).args[1]();
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
