var expect = require('chai').expect,
    _ = require('lodash'),
    remoteHelperStub = require('../stubs/remote-helper'),
    wsStub = require('../stubs/ws'),
    proxyquire = require('proxyquire'),
    Client = proxyquire('../../src/local/ws-client', {
        './remote-helper': remoteHelperStub,
        'ws': wsStub
    });

var params = {
    secret: 'keepitsafe',
    prefersEncrypted: false,
    retryOnDisconnect: true,
    hostname: 'somehost',
    websocketPort: 1234,
    username: 'joel'
};

describe('ws-client', function() {
    var ws = null;

    beforeEach(function() {
        ws = new Client(params);
    });

    afterEach(function() {
        remoteHelperStub.resetAll();
        wsStub.resetAll();
    });

    describe('connection', function() {
        it('should register callbacks via the `on` method', function() {
            expect(wsStub._api.on.called).to.be.true;
        });

        it('should register a callback for the `open` message', function() {
            expect(wsStub._api.on.getCall(0).args[0]).to.equal('open');
            expect(wsStub._api.on.getCall(0).args[1]).to.be.a('function');
        });

        it('should register a callback for the `close` message', function() {
            expect(wsStub._api.on.getCall(1).args[0]).to.equal('close');
            expect(wsStub._api.on.getCall(1).args[1]).to.be.a('function');
        });

        it('should register a callback for the `error` message', function() {
            expect(wsStub._api.on.getCall(2).args[0]).to.equal('error');
            expect(wsStub._api.on.getCall(2).args[1]).to.be.a('function');
        });
    });

    describe('#send', function () {
        it('should attach the secret to the passed in object', function() {
            ws.send({some: 'object'});

            expect(JSON.parse(wsStub._api.send.lastCall.args[0]).secret).to.not.be.a('undefined');
        });
    });

    describe('onOpen', function() {
        beforeEach(function() {
            // Trigger `open`
            wsStub._api.on.getCall(0).args[1]();
        });

        it('should emit a `ready` event', function(done) {
            ws.on('ready', done);
            wsStub._api.on.getCall(0).args[1]();
        });
    });

    describe('onClose', function() {
        beforeEach(function() {
            // Trigger `close`
            wsStub._api.on.getCall(1).args[1]();
        });

        it('should attempt to re-awaken the devbox if `retryOnDisconnect` is true', function() {
            expect(remoteHelperStub._api.start.called).to.be.true;
        });
        
        it('should emit a `disconnected` event when `retryOnDisconnect` is false', function(done) {
            wsStub._api.on.reset();
            var noRetryParams = _.clone(params);
            noRetryParams.retryOnDisconnect = false;

            var wsNoRetry = new Client(noRetryParams);
            wsNoRetry.once('disconnected', done);

            // Trigger `close`
            wsStub._api.on.getCall(1).args[1]();
        });
    });

    describe('onError', function() {
        beforeEach(function() {
            // Trigger `error`
            wsStub._api.on.getCall(2).args[1]();
        });

        it('should emit an `reconnecting` event', function(done) {
            ws.on('reconnecting', done);

            // Trigger `error`
            wsStub._api.on.getCall(2).args[1]();
        });

        it('should start the remote devbox', function() {
            expect(remoteHelperStub._api.start.called).to.be.true;
        });

        it('should listen for the `ready` message from the devbox', function() {
            expect(remoteHelperStub._api.on.getCall(0).args[0]).to.equal('ready');
            expect(remoteHelperStub._api.on.getCall(0).args[1]).to.be.a('function');
        });

        it('should listen for the `message` message from the devbox', function() {
            expect(remoteHelperStub._api.on.getCall(1).args[0]).to.equal('message');
            expect(remoteHelperStub._api.on.getCall(1).args[1]).to.be.a('function');
        });
    });
});
