var _ = require('lodash'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    rewire = require('rewire'),
    remote = rewire('../../src/remote');

// Test Data
var serverOpts = {
    port: 1234,
    secret: 'dirty-little',
    debug: true,
    encrypt: false
};

// Mocks
var processMock = {
    exit: sinon.spy()
};
var consoleMock = {
    warn: sinon.spy(),
    log: sinon.spy()
};
var serverMockAPI = {
    on: sinon.spy()
};
var ServerMock = sinon.stub().returns(serverMockAPI);

var fsMockAPI = {
    on: sinon.spy(),
    addFile: sinon.spy(),
    addDir: sinon.spy(),
    removePath: sinon.spy()
};
var FSMock = sinon.stub().returns(fsMockAPI);

// Mock Injection
remote.__set__({
    Server: ServerMock,
    FSHelper: FSMock,
    console: consoleMock,
    process: processMock
});

// Helpers
function resetMock(method) {
    method.reset();
}

function getFSOnCall(event) {
    var callArgs = null;

    _.each(fsMockAPI.on.getCalls(), function(call) {
        if (call.args[0] === event) callArgs = call.args[1];
    });

    return callArgs;
}

function getServerOnCall(event) {
    var callArgs = null;

    _.each(serverMockAPI.on.getCalls(), function(call) {
        if (call.args[0] === event) callArgs = call.args[1];
    });

    return callArgs;
}

describe('Remote Entry (index.js)', function () {
    afterEach(function() {
        FSMock.reset();
        ServerMock.reset();
        _.forIn(consoleMock, resetMock);
        _.forIn(serverMockAPI, resetMock);
        _.forIn(fsMockAPI, resetMock);
        _.forIn(processMock, resetMock);
    });

    it('should warn when the there is no port passed in', function() {
        remote({
            secret: 'my-secret'
        });

        expect(consoleMock.warn.lastCall.args[0]).to.contain('-port, -p, is required');
    });

    it('should warn when the there is no secret passed in', function() {
        remote({
            port: 1234
        });

        expect(consoleMock.warn.lastCall.args[0]).to.contain('--secret, -s, is required');
    });

    describe('Server Events', function () {
        beforeEach(function () {
            remote(serverOpts);            
        });

        it('should log a message and exit if an unauthorized message happens', function() {
            getServerOnCall('unauthorized')();

            expect(processMock.exit.called).to.be.true;
            expect(consoleMock.log.lastCall.args.join(' ')).to.contain('Unauthorized connection, shutting down');
        });

        it('should log a message and exit if the client disconnects', function() {
            getServerOnCall('connection-closed')();

            expect(processMock.exit.called).to.be.true;
            expect(consoleMock.log.lastCall.args.join(' ')).to.contain('Connection closed, shutting down');
        });

        describe('file-change events', function () {
            it('should pass along `add` changeType\'s to addFile', function() {
                var message = {
                    changeType: 'add'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.addFile.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `addDir` changeType\'s to addDir', function() {
                var message = {
                    changeType: 'addDir'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.addDir.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `change` changeType\'s to addFile', function() {
                var message = {
                    changeType: 'change'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.addFile.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlink` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlink'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlink` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlink'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlinkDir` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlinkDir'
                };
                getServerOnCall('file-change')(message);
                expect(fsMockAPI.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should do nothing if the change type isn\'t known', function() {
                var message = {
                    changeType: 'wat!!'
                };
                getServerOnCall('file-change')(message);

                _.forIn(fsMockAPI, function(method, name) {
                    if (name !== 'on') expect(method.called).to.be.false;
                });
            });
        });
    });

    describe('File Events', function () {
        beforeEach(function () {
            remote(serverOpts);
        });

        it('should log files that have been added', function() {
            getFSOnCall('add-file')('add');

            expect(consoleMock.log.lastCall.args.join()).to.contain('<');
            expect(consoleMock.log.lastCall.args.join()).to.contain('add');
        });

        it('should log directories that have been added', function() {
            getFSOnCall('add-dir')('dir');

            expect(consoleMock.log.lastCall.args.join()).to.contain('<');
            expect(consoleMock.log.lastCall.args.join()).to.contain('dir');
        });

        it('should log files/dirs that have been deleted', function() {
            getFSOnCall('delete')('delete');

            expect(consoleMock.log.lastCall.args.join()).to.contain('<');
            expect(consoleMock.log.lastCall.args.join()).to.contain('delete');
        });

        it('should log error files that have been added', function() {
            getFSOnCall('add-file-error')('add');

            expect(consoleMock.log.lastCall.args.join()).to.contain('ERR');
            expect(consoleMock.log.lastCall.args.join()).to.contain('add');
        });

        it('should log error directories that have been added', function() {
            getFSOnCall('add-dir-error')('dir');

            expect(consoleMock.log.lastCall.args.join()).to.contain('ERR');
            expect(consoleMock.log.lastCall.args.join()).to.contain('dir');
        });

        it('should log error files/dirs that have been deleted', function() {
            getFSOnCall('delete-error')('delete');

            expect(consoleMock.log.lastCall.args.join()).to.contain('ERR');
            expect(consoleMock.log.lastCall.args.join()).to.contain('delete');
        });
    });
});
