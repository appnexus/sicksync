var _ = require('lodash'),
    expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    FSHelper = rewire('../../src/local/fs-helper'),
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
    var fsHelper = null;
    var cachedWatcher = FSHelper.__get__('watcher');
    var cachedFS = FSHelper.__get__('fs');

    beforeEach(function () {
        // Inject mocks
        FSHelper.__set__('watcher', watcherMock);
        FSHelper.__set__('fs', fsMock);
        fsHelper = new FSHelper(config);
    });

    afterEach(function() {
        FSHelper.__set__('watcher', cachedWatcher);
        FSHelper.__set__('fs', cachedFS);
        watcherOnMock.reset();
        watcherMock.reset();
        fsMock.readFileSync.reset();
        watcherMock.reset();
    });

    describe('#watch', function () {
        it('should watch the source directory', function() {
            fsHelper.watch();
            expect(watcherMock.lastCall.args[0]).to.equal(config.sourceLocation);
        });

        it('should pass a list of ignored files to the watcher', function() {
            fsHelper.watch();
            expect(watcherMock.lastCall.args[1].ignored).to.eql(config.excludes);
        });

        it('should persist the watch', function() {
            fsHelper.watch();
            expect(watcherMock.lastCall.args[1].persistent).to.be.true;
        });

        it('should pass in a flag for symlinks', function() {
            fsHelper.watch();
            expect(watcherMock.lastCall.args[1].followSymlinks).to.equal(config.followSymlinks);
        });

        it('should pass in an empty array of ignores if none are there', function() {
            var noExcludesConfig = _.clone(config);
            
            delete noExcludesConfig.excludes;

            fsHelper = new FSHelper(noExcludesConfig);
            expect(watcherMock.lastCall.args[1].ignored).to.eql([]);
        });

        describe('#on', function () {
            beforeEach(function () {
                fsHelper.watch();
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
                fsHelper.watch();
            });

            it('should pass along the file contents', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.contents).to.be.a('string');
                    expect(data.localpath).to.equal(config.sourceLocation + localPath);
                    expect(data.relativepath).to.equal(localPath);
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

            it('should emit events when unpaused', function(done) {
                fsHelper.once('file-change', function(data) {
                    expect(data.relativepath).to.contain(localPath);
                    done();
                });
                fsHelper.pauseWatch();
                fsHelper.watch();
                triggerFsEvent('unlink', config.sourceLocation + localPath);
            });
        });
    });
});
