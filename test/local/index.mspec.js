var _ = require('lodash'),
    expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    util = require('../../src/util'),
    entry = rewire('../../src/local');

// Test Data
var testConfig = {
    retryOnDisconnect: true,
    debug: true,
    projects: {
        myProject: {
            project: 'myProject',
            excludes: ['.git'],
            sourceLocation: '~/wat',
            destinationLocation: '~/wat',
            hostname: 'yo-dawg',
            username: 'j-diddy',
            followSymlinks: false,
            websocketPort: 1234,
            prefersEncrypted: false
        }
    }
};
var projectConfig = testConfig.projects.myProject;

// Mocks
var consoleSpy = {
    log: sinon.spy()
};
var processMock = {
    exit: sinon.spy()
};
var loggerMock = sinon.spy();
var utilMock = _.clone(util);
utilMock.generateLog = sinon.stub().returns(loggerMock);

var WsClientAPI = {
    on: sinon.spy(),
    send: sinon.spy()
};
var WSClientMock = sinon.stub().returns(WsClientAPI);

var FSClientAPI = {
    on: sinon.spy(),
    watch: sinon.spy(),
    pauseWatch: sinon.spy()
};
var FSClientMock = sinon.stub().returns(FSClientAPI);

var bigSyncMock = sinon.spy();

// Helpers
function resetMock(method) {
    method.reset();
}

function getWSOnCall(event) {
    var callArgs = null;

    _.each(WsClientAPI.on.getCalls(), function(call) {
        if (call.args[0] === event) callArgs = call.args[1];
    });

    return callArgs;
}

function getFSOnCall(event) {
    var callArgs = null;

    _.each(FSClientAPI.on.getCalls(), function(call) {
        if (call.args[0] === event) callArgs = call.args[1];
    });

    return callArgs;
}

function triggerBigSyncComplete() {
    bigSyncMock.lastCall.args[2]();
}

// Inject Mocks
entry.__set__({
    bigSync: bigSyncMock,
    FSHelper: FSClientMock,
    WebSocketClient: WSClientMock,
    util: utilMock,
    console: consoleSpy,
    process: processMock
}); 

describe('Client Entry (index.js)', function () {
    afterEach(function() {
        consoleSpy.log.reset();
        bigSyncMock.reset();
        FSClientMock.reset();
        WSClientMock.reset();
        loggerMock.reset();
        processMock.exit.reset();
        utilMock.generateLog.reset();
        _.forIn(FSClientAPI, resetMock);
        _.forIn(WsClientAPI, resetMock);
    });

    describe('#start', function () {
        beforeEach(function () {
            entry.start(testConfig, ['myProject']);
        });

        describe('when the project isn\'t found in the config', function () {
            it('should log a message in the console for that project', function() {
                var missingProject = 'atlantis';
                
                entry.start(testConfig, ['myProject', missingProject]);
                expect(consoleSpy.log.lastCall.args.join(' ')).to.contain('couldn\'t find this project in your config');
                expect(consoleSpy.log.lastCall.args.join(' ')).to.contain(missingProject);
            });
        });

        describe('WSClient', function () {
            it('should instantiate a new WSClient with the appropriate params', function() {
                var params = WSClientMock.lastCall.args[0],
                    projectConfig = testConfig.projects.myProject;

                expect(params.username).to.equal(projectConfig.username);
                expect(params.hostname).to.equal(projectConfig.hostname);
                expect(params.websocketPort).to.equal(projectConfig.websocketPort);
                expect(params.secret).to.be.a('string');
                expect(params.prefersEncrypted).to.equal(projectConfig.prefersEncrypted);
                expect(params.retryOnDisconnect).to.equal(testConfig.retryOnDisconnect);
            });

            describe('on:ready', function () {
                beforeEach(function () {
                    getWSOnCall('ready')();
                });

                it('should trigger a bigSync', function() {
                    var bigSyncParams = bigSyncMock.lastCall.args[0];

                    expect(bigSyncParams.project).to.equal(projectConfig.project);
                    expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
                    expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
                    expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
                    expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
                    expect(bigSyncParams.username).to.eql(projectConfig.username);
                    expect(bigSyncMock.lastCall.args[1].debug).to.equal(testConfig.debug);
                });

                it('should start the file watch and log that it\'s connected', function() {
                    triggerBigSyncComplete();
                    var loggedMessage = loggerMock.lastCall.args.join(' ');
                    
                    expect(FSClientAPI.watch.called).to.be.true;

                    expect(loggedMessage).to.contain('Connected');
                    expect(loggedMessage).to.contain(projectConfig.hostname);
                    expect(loggedMessage).to.contain('not using encryption');
                });

                it('should log a message indicating that it\'s using encryption', function() {
                    var encryptionConfig = _.clone(testConfig);
                    encryptionConfig.projects.myProject.prefersEncrypted = true;

                    entry.start(encryptionConfig, ['myProject']);
                    getWSOnCall('ready')();
                    triggerBigSyncComplete();
                    console.log(loggerMock.lastCall.args.join(' '));
                    expect(loggerMock.lastCall.args.join(' ')).to.contain('using encryption');
                });
            });

            describe('on:reconnecting', function () {
                beforeEach(function () {
                    getWSOnCall('reconnecting')();
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(loggerMock.lastCall.args.join(' ')).to.contain('Reconnecting');
                });
            });

            describe('on:disconnected', function () {
                beforeEach(function () {
                    getWSOnCall('disconnected')();
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(loggerMock.lastCall.args.join(' ')).to.contain('Lost connection');
                });
            });

            describe('on:remote-error', function () {
                beforeEach(function () {
                    getWSOnCall('remote-error')();
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(loggerMock.lastCall.args.join(' ')).to.contain('Couldn\'t start sicksync process');
                });
            });

            describe('on:remote-message', function () {
                it('should log a message if the message contains the destinationLocation', function() {
                    getWSOnCall('remote-message')(projectConfig.destinationLocation + '/');
                    expect(loggerMock.lastCall.args.join(' ')).to.contain(projectConfig.destinationLocation);
                });

                it('should not log a message if the message does not contain the destinationLocation', function() {
                    getWSOnCall('remote-message')('not-my-source');
                    expect(loggerMock.called).to.be.false;
                });
            });
        });

        describe('FSClient', function () {
            var fileChange = {
                relativepath: 'my/file/change.txt',
                localpath: projectConfig.destinationLocation + '/' + 'my/file/change.txt',
                changeType: 'add'
            };

            describe('on:file-change', function () {
                beforeEach(function () {
                    getFSOnCall('file-change')(fileChange);
                });

                it('should log a message on file changes', function() {
                    var loggedMessage = loggerMock.lastCall.args.join(' ');

                    expect(loggedMessage).to.contain('>');
                    expect(loggedMessage).to.contain(fileChange.changeType);
                    expect(loggedMessage).to.contain(fileChange.localpath);
                });

                it('should send the file through the ws client and add in the appropriate properties', function() {
                    var sendCall = WsClientAPI.send.lastCall.args[0];

                    expect(sendCall.destinationpath).to.equal(projectConfig.destinationLocation + '/' + fileChange.relativepath);
                    expect(sendCall.subject).to.equal('file');
                });
            });

            describe('on:large-change', function () {
                beforeEach(function () {
                    getFSOnCall('large-change')(fileChange);
                });

                it('should log a large change has been detected', function() {
                    expect(loggerMock.lastCall.args[0]).to.contain('large change');
                });

                it('should pause the fs-watch', function() {
                    expect(FSClientAPI.pauseWatch.called).to.be.true;
                });

                it('should trigger a bigSync', function() {
                    var bigSyncParams = bigSyncMock.lastCall.args[0];

                    expect(bigSyncParams.project).to.equal(projectConfig.project);
                    expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
                    expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
                    expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
                    expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
                    expect(bigSyncParams.username).to.eql(projectConfig.username);
                    expect(bigSyncMock.lastCall.args[1].debug).to.equal(testConfig.debug);
                });

                describe('when the bigSync completes', function () {
                    beforeEach(function () {
                        triggerBigSyncComplete();
                    });

                    it('should log that the change was successful after bigSync completes', function() {
                        expect(loggerMock.lastCall.args[0]).to.contain('change sent');
                    });

                    it('should start the restart the file watch', function() {
                        expect(FSClientAPI.watch.called).to.be.true;
                    });
                });
            });
        });
    });

    describe('#once', function () {
        beforeEach(function () {
            entry.once(testConfig, ['myProject'], { dry: false, debug: true });   
        });

        describe('when the project isn\'t found in the config', function () {
            it('should log a message in the console for that project', function() {
                var missingProject = 'atlantis';
                
                entry.once( testConfig, ['myProject', missingProject], {});
                expect(consoleSpy.log.lastCall.args.join(' ')).to.contain('couldn\'t find this project in your config');
                expect(consoleSpy.log.lastCall.args.join(' ')).to.contain(missingProject);
            });
        });

        it('log a message that it\'s initiating a one-time sync', function() {
            expect(loggerMock.lastCall.args.join(' ')).to.contain('one-time sync');
        });

        it('should call bigSync with the appropriate params', function() {
            var bigSyncParams = bigSyncMock.lastCall.args[0];

            expect(bigSyncParams.project).to.equal(projectConfig.project);
            expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
            expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
            expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
            expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
            expect(bigSyncParams.username).to.eql(projectConfig.username);
            expect(bigSyncMock.lastCall.args[1].debug).to.equal(testConfig.debug);
        });

        it('should log a message when it\'s complete', function() {
            triggerBigSyncComplete();
            expect(loggerMock.lastCall.args.join(' ')).to.contain('sync complete');
        });
    });
});
