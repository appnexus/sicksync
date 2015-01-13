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

var utilMock = {
    wakeDevBox: sinon.spy()
};

var configMock = {
    hostname: 'somehost',
    secret: 'keepitsafe'
};

Client.__set__('config', configMock);
Client.__set__('util', utilMock);
Client.__set__('crypt', cryptMock);
Client.__set__('WebSocket', WsMock);

describe('ws-client', function() {

    afterEach(function() {
        testUtils.resetSpies(wsMock);
        utilMock.wakeDevBox.reset();
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

    describe('onOpen', function() {
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
            expect(sendCall.token).to.equal(configMock.secret);
        });
    });

    describe('onMessage', function() {
        var ws = null;

        function triggerMessage(obj) {
            wsMock.on.getCall(1).args[1](JSON.stringify(obj));
        }

        beforeEach(function() {
            ws = new Client({
                url: 'ws://somewebsocket'
            });
        });

        it('should emit an `authorized` event when the message subject is `handshake` and `isAllowed` is true', function(done) {
            ws.on('authorized', function() {
                done();
            });
            triggerMessage({subject: 'handshake', isAllowed: true});
        });

        it('should ignore all other messages', function(done) {
            var authorizedSpy = sinon.spy();

            ws.on('authorized', authorizedSpy);
            triggerMessage({subject: 'handshake', isAllowed: false});
            triggerMessage({isAllowed: false});

            setTimeout(function() {
                expect(authorizedSpy.called).to.be.false();
                done();
            }, 10);
        });
    });

    describe('onClose', function() {
        var ws = null;
        var oldProcess = Client.__get__('process');
        var oldConsole = Client.__get__('console');
        var consoleMock = {
            log: sinon.spy()
        };
        var processMock = {
            exit: sinon.spy(),
            on: sinon.spy()
        };

        beforeEach(function() {
            Client.__set__('console', consoleMock);
            Client.__set__('process', processMock);
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `close`
            wsMock.on.getCall(2).args[1]();
        });

        afterEach(function() {
            processMock.exit.reset();
            consoleMock.log.reset();
            Client.__set__('process', oldProcess);
            Client.__set__('console', oldConsole);
        });

        it('should log the result', function() {
            expect(consoleMock.log.getCall(0).args[0]).to.contain('closed the connection. Shutting down.');
        });

        it('should close the process', function() {
            expect(processMock.exit.called).to.be.true();
        });
    });

    describe('onError', function() {
        var ws = null;
        var oldProcess = Client.__get__('process');
        var oldConsole = Client.__get__('console');
        var consoleMock = {
            log: sinon.spy()
        };
        var processMock = {
            exit: sinon.spy(),
            on: sinon.spy()
        };

        beforeEach(function() {
            Client.__set__('console', consoleMock);
            Client.__set__('process', processMock);
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger `error`
            wsMock.on.getCall(3).args[1]();
        });

        afterEach(function() {
            processMock.exit.reset();
            consoleMock.log.reset();
            Client.__set__('process', oldProcess);
            Client.__set__('console', oldConsole);
        });

        it('should log the problem, and try to wake the dev box', function() {
            expect(consoleMock.log.getCall(0).args[0]).to.contain('Starting syncer with ');
        });

        it('should call util#wakeDevBox', function() {
            expect(utilMock.wakeDevBox.called).to.be.true();
        });

        it('should pass in the hostname and callback function into the #wakeDevBox call', function() {
            expect(utilMock.wakeDevBox.getCall(0).args[0]).to.equal(configMock.hostname);
            expect(utilMock.wakeDevBox.getCall(0).args[1]).to.be.a('function');
        });
    });

    describe('on `SIGINT`', function() {
        var ws = null;
        var oldProcess = Client.__get__('process');
        var processMock = {
            exit: sinon.spy(),
            on: sinon.spy()
        };

        beforeEach(function() {
            Client.__set__('process', processMock);
            ws = new Client({
                url: 'ws://somewebsocket'
            });

            // Trigger SIGINT
            processMock.on.getCall(0).args[1]();
        });

        afterEach(function() {
            processMock.exit.reset();
            Client.__set__('process', oldProcess);
        });

        it('should send a `close` message to the dev box', function() {
            var sendArgs = JSON.parse(wsMock.send.getCall(0).args[0]);
            expect(wsMock.send.called).to.be.true();
            expect(sendArgs.subject).to.equal('close');
        });
    });
});