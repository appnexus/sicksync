var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    fsHelper = rewire('../../lib/local/fs-helper'),
    config = {
        sourceLocation: 'my/home/',
        destinationLocation: 'my/remote/box/',
        excludes: ['.git']
    };

// Mocks
var watcherOnMock = sinon.spy(),
    watcherMock = sinon.stub().returns({ on: watcherOnMock }),
    fsMock = {
        readFileSync: sinon.stub().returnsArg(0)
    };

function triggerFsEvent(event, filepath) {
    watcherOnMock.lastCall.args[1](event, filepath);
}

describe('local fs-helper', function() {
    var cachedConfig = fsHelper.__get__('config');
    var cachedIgnore = fsHelper.__get__('ignored');

    beforeEach(function () {
        fsHelper.__set__('watcher', watcherMock);
        fsHelper.__set__('fs', fsMock);
        fsHelper.__set__('config', config);
        fsHelper.__set__('ignored', config.excludes);
    });

    afterEach(function() {
        fsHelper.__set__('config', cachedConfig);
        fsHelper.__set__('ignored', cachedIgnore);
        watcherOnMock.reset();
        watcherMock.reset();
        fsMock.readFileSync.reset();
        watcherMock.reset();
    });

    describe('#start', function () {
        it('should watch the source directory', function() {
            fsHelper.start();
            expect(watcherMock.lastCall.args[0]).to.equal(config.sourceLocation);
        });

        it('should pass a list of ignored files to the watcher', function() {
            fsHelper.start();
            expect(watcherMock.lastCall.args[1].ignored).to.eql(config.excludes);
        });

        it('should persist the watch', function() {
            fsHelper.start();
            expect(watcherMock.lastCall.args[1].persistent).to.be.true;
        });

        it('should pass in a flag for symlinks', function() {
            fsHelper.start();
            expect(watcherMock.lastCall.args[1].followSymlinks).to.equal(config.followSymlinks);
        });

        describe('#on', function () {
            beforeEach(function () {
                fsHelper.start();
            });

            it('should register an `all` callback', function() {
                expect(watcherOnMock.lastCall.args[0]).to.equal('all');
            });

            it('should pass in a function for the `all` callback', function() {
                expect(watcherOnMock.lastCall.args[1]).to.be.a('function');
            });
        });

        describe('fs events', function () {
            var localPath = 'file/path';

            beforeEach(function () {
                fsHelper.start();
            });

            it('should emit an event with the subject of `file`', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.subject).to.equal('file');
                    done();
                });
                triggerFsEvent('add', config.sourceLocation + localPath);
            });

            it('should generate a full path to the file on the remote machine', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.filepath).to.contain(config.destinationLocation);
                    expect(data.filepath).to.contain(localPath);
                    done();
                });
                triggerFsEvent('add', config.sourceLocation + localPath);
            });

            it('should pass along the file contents', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.contents).to.be.a('string');
                    done();
                });
                triggerFsEvent('add', config.sourceLocation + localPath);
            });

            it('should not pass along the file contents if the event isn\'t add or change', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.contents).to.be.null;
                    done();
                });
                triggerFsEvent('unlink', config.sourceLocation + localPath);
            });

            it('should not emit events for files that are ignored', function() {
                fsHelper.once('file-change', function() {
                    expect.fail('File changes shouldn\'t happen when ignored.');
                });
                triggerFsEvent('unlink', config.sourceLocation + '.git');
            });

            it('should not emit events when the watch is paused', function() {
                fsHelper.once('file-change', function() {
                    expect.fail('File changes shouldn\'t happen when paused.');
                });
                fsHelper.pauseWatch();
                triggerFsEvent('unlink', config.sourceLocation + localPath);
            });

            it('should emit events when unpaused', function() {
                fsHelper.once('file-change', function() {
                    throw new Error('`file-change` should not emit messages for ignored files');
                });
                fsHelper.pauseWatch();
                fsHelper.unpauseWatch();
                triggerFsEvent('unlink', config.sourceLocation + localPath);
            });
        });
    });
});
