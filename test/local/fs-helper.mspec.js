var _ = require('lodash'),
    expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    fsHelper = rewire('../../lib/local/fs-helper'),
    config = {
        sourceLocation: 'my/home',
        destinationLocation: 'my/remote/box',
        excludes: ['ignored']
    },
    ignored = config.excludes;

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
        fsHelper.__set__('ignored', ignored);
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
            it('should trigger emit an event when a fs change happens', function() {
                fsHelper.start();
                fsHelper.on('file-change', function(data) {
                    console.log(data);
                    console.log(fsHelper.__get__('config'))
                });
                triggerFsEvent('add', 'my/home/file/path');
            });
        });
    });
});
