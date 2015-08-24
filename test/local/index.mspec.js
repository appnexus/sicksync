var _ = require('lodash'),
    expect = require('chai').expect,
    proxyquire = require('proxyquire'),
    
    // Stubs
    utilStub = require('../stubs/util'),
    processStub = require('../stubs/process'),
    bigSyncStub = require('../stubs/big-sync'),
    fsHelperStub = require('../stubs/client-fs-helper'),
    wsClientStub = require('../stubs/ws-client'),
    
    // Entry
    entry = proxyquire('../../src/local', {
        './fs-helper': fsHelperStub,
        './ws-client': wsClientStub,
        '../big-sync': bigSyncStub,
        '../util': utilStub,
        'process': processStub
    });

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

describe('Client Entry (index.js)', function () {

    beforeEach(function() {
        processStub.inject();
    });

    afterEach(function() {
        processStub.restore();
        utilStub.resetAll();
        bigSyncStub.resetAll();
        fsHelperStub.resetAll();
        wsClientStub.resetAll();
    });

    describe('#start', function () {
        beforeEach(function () {
            entry.start(testConfig, ['myProject']);
        });

        describe('WSClient', function () {
            it('should instantiate a new WSClient with the appropriate params', function() {
                var params = wsClientStub.lastCall.args[0],
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
                    wsClientStub.triggerEvent('ready');
                });

                it('should trigger a bigSync', function() {
                    var bigSyncParams = bigSyncStub.lastCall.args[0];

                    expect(bigSyncParams.project).to.equal(projectConfig.project);
                    expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
                    expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
                    expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
                    expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
                    expect(bigSyncParams.username).to.eql(projectConfig.username);
                    expect(bigSyncStub.lastCall.args[1].debug).to.equal(testConfig.debug);
                });

                it('should start the file watch and log that it\'s connected', function() {
                    bigSyncStub.triggerBigSyncComplete();
                    var loggedMessage = utilStub.logSpy.lastCall.args.join(' ');
                    
                    expect(fsHelperStub._api.watch.called).to.be.true;

                    expect(loggedMessage).to.contain('Connected');
                    expect(loggedMessage).to.contain(projectConfig.hostname);
                    expect(loggedMessage).to.contain('not using encryption');
                });

                it('should log a message indicating that it\'s using encryption', function() {
                    var encryptionConfig = _.clone(testConfig);
                    encryptionConfig.projects.myProject.prefersEncrypted = true;

                    entry.start(encryptionConfig, ['myProject']);
                    wsClientStub.triggerEvent('ready');
                    bigSyncStub.triggerBigSyncComplete();

                    expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('using encryption');
                });
            });

            describe('on:reconnecting', function () {
                beforeEach(function () {
                    wsClientStub.triggerEvent('reconnecting');
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('Reconnecting');
                });
            });

            describe('on:disconnected', function () {
                beforeEach(function () {
                    wsClientStub.triggerEvent('disconnected');
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('Lost connection');
                });
            });

            describe('on:remote-error', function () {
                beforeEach(function () {
                    wsClientStub.triggerEvent('remote-error');
                });

                it('should log a message that it\'s reconnecting', function() {
                    expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('Couldn\'t start sicksync process');
                });
            });

            describe('on:remote-message', function () {
                it('should log a message if the message contains the destinationLocation', function() {
                    wsClientStub.triggerEvent('remote-message', projectConfig.destinationLocation + '/');
                    expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain(projectConfig.destinationLocation);
                });

                it('should not log a message if the message does not contain the destinationLocation', function() {
                    wsClientStub.triggerEvent('remote-message', 'not-my-source');
                    expect(utilStub.logSpy.called).to.be.false;
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
                    fsHelperStub.triggerFsCall('file-change', fileChange);
                });

                it('should log a message on file changes', function() {
                    var loggedMessage = utilStub.logSpy.lastCall.args.join(' ');

                    expect(loggedMessage).to.contain('>');
                    expect(loggedMessage).to.contain(fileChange.changeType);
                    expect(loggedMessage).to.contain(fileChange.localpath);
                });

                it('should send the file through the ws client and add in the appropriate properties', function() {
                    var sendCall = wsClientStub._api.send.lastCall.args[0];

                    expect(sendCall.destinationpath).to.equal(projectConfig.destinationLocation + '/' + fileChange.relativepath);
                    expect(sendCall.subject).to.equal('file');
                });
            });

            describe('on:large-change', function () {
                beforeEach(function () {
                    fsHelperStub.triggerFsCall('large-change', fileChange);
                });

                it('should log a large change has been detected', function() {
                    expect(utilStub.logSpy.lastCall.args[0]).to.contain('large change');
                });

                it('should pause the fs-watch', function() {
                    expect(fsHelperStub._api.pauseWatch.called).to.be.true;
                });

                it('should trigger a bigSync', function() {
                    var bigSyncParams = bigSyncStub.lastCall.args[0];

                    expect(bigSyncParams.project).to.equal(projectConfig.project);
                    expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
                    expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
                    expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
                    expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
                    expect(bigSyncParams.username).to.eql(projectConfig.username);
                    expect(bigSyncStub.lastCall.args[1].debug).to.equal(testConfig.debug);
                });

                describe('when the bigSync completes', function () {
                    beforeEach(function () {
                        bigSyncStub.triggerBigSyncComplete();
                    });

                    it('should log that the change was successful after bigSync completes', function() {
                        expect(utilStub.logSpy.lastCall.args[0]).to.contain('change sent');
                    });

                    it('should start the restart the file watch', function() {
                        expect(fsHelperStub._api.watch.called).to.be.true;
                    });
                });
            });
        });
    });

    describe('#once', function () {
        beforeEach(function () {
            entry.once(testConfig, ['myProject'], { dry: false, debug: true });   
        });

        it('log a message that it\'s initiating a one-time sync', function() {
            expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('one-time sync');
        });

        it('should call bigSync with the appropriate params', function() {
            var bigSyncParams = bigSyncStub.lastCall.args[0];

            expect(bigSyncParams.project).to.equal(projectConfig.project);
            expect(bigSyncParams.excludes).to.eql(projectConfig.excludes);
            expect(bigSyncParams.sourceLocation).to.eql(projectConfig.sourceLocation + '/');
            expect(bigSyncParams.destinationLocation).to.eql(projectConfig.destinationLocation + '/');
            expect(bigSyncParams.hostname).to.eql(projectConfig.hostname);
            expect(bigSyncParams.username).to.eql(projectConfig.username);
            expect(bigSyncStub.lastCall.args[1].debug).to.equal(testConfig.debug);
        });

        it('should log a message when it\'s complete', function() {
            bigSyncStub.triggerBigSyncComplete();
            expect(utilStub.logSpy.lastCall.args.join(' ')).to.contain('sync complete');
        });
    });
});
