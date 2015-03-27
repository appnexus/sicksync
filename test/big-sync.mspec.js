var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    bigSync = rewire('../lib/big-sync'),
    testUtils = require('./utils');

var mockConfig = testUtils.makeMockConfig();

var multiDirMockConfig = testUtils.makeMockConfig({
    sourceLocation: [
        '/some/file/path',
        '/other/file/path',
        '/yet/another/file/path'
    ],
    destinationLocation: [
        '/some/destination/file/path',
        '/some/other/destination/file/path',
        '/all/the/destination/file/paths'
    ]
});

var rsyncSpies = (function() {
    function BuildSpies() {}

    BuildSpies.prototype.shell = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.flags = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.exclude = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.source = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.destination = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.execute = function(cb) { cb(); };

    return new BuildSpies();
})();

var RsyncMockConstructorSpyObject = { 
    RsyncMockConstructor: function() {
        return rsyncSpies;
    }
};

var rsyncConstructorSpy = sinon.spy(RsyncMockConstructorSpyObject, 'RsyncMockConstructor');

describe('bigSync', function() {

    it('should be a function', function() {
        expect(bigSync).to.be.a.function;
    });

    describe('when config is empty', function() {
        var oldConsole = bigSync.__get__('console');
        var consoleSpy = {
            log: sinon.spy()
        };

        beforeEach(function() {
            bigSync.__set__('console', consoleSpy);
            bigSync.__set__('config', {});
        });

        afterEach(function() {
            bigSync.__set__('console', oldConsole);
        });

        it('should log a message to run `sicksync --setup`', function() {
            bigSync();
            expect(consoleSpy.log.called).to.be.true();
            expect(consoleSpy.log.getCall(0).args[0]).to.contain('--setup');
        });
    });

    describe('when executed', function() {

        beforeEach(function(done) {
            bigSync.__set__('Rsync', RsyncMockConstructorSpyObject.RsyncMockConstructor);
            bigSync.__set__('config', mockConfig);
            bigSync(done);
        });

        afterEach(function() {
            testUtils.resetSpies(rsyncSpies); // TODO: this doesn't actually reset these spies, needs to be fixed
            rsyncConstructorSpy.reset();
        });

        it('should set the `shell` property to `ssh`', function() {
            expect('ssh').to.equal(rsyncSpies.shell.getCall(0).args[0]);
        });

        it('should set the `flags` property to `az`', function() {
            expect('az').to.equal(rsyncSpies.flags.getCall(0).args[0]);
        });

        it('should set the `exclude` property to match the one in config', function() {
            expect(mockConfig.excludes).to.deep.equal(rsyncSpies.exclude.getCall(0).args[0]);
        });

        it('should set the `source` property to match the on one in the config', function() {
            expect(mockConfig.sourceLocation[0]).to.equal(rsyncSpies.source.getCall(0).args[0]);
        });

        it('should set the `destination` property to match the on one in the config', function() {
            var destination = mockConfig.hostname + ':' + mockConfig.destinationLocation;
            expect(destination).to.equal(rsyncSpies.destination.getCall(0).args[0]);
        });
    });

    describe('with multiple directories to sync', function(){
        beforeEach(function(done) {
            bigSync.__set__('Rsync', RsyncMockConstructorSpyObject.RsyncMockConstructor);
            bigSync.__set__('config', multiDirMockConfig);
            bigSync(done);
        });

        afterEach(function() {
            testUtils.resetSpies(rsyncSpies); // TODO: this doesn't actually reset these spies, needs to be fixed
            rsyncConstructorSpy.reset();
        });

        it('should call rsync a number of times equal to the length of config.sourceLocation', function() {
            expect(rsyncConstructorSpy.callCount).to.equal(multiDirMockConfig.sourceLocation.length);
        });
    });

    describe('with incorrectly formatted config source/destination locations', function() {
        beforeEach(function() {
            bigSync.__set__('Rsync', RsyncMockConstructorSpyObject.RsyncMockConstructor);
        });

        afterEach(function() {
            testUtils.resetSpies(rsyncSpies); // TODO: this doesn't actually reset these spies, needs to be fixed
            rsyncConstructorSpy.reset();
        });

        it('should throw an exception when source/destination locations are not arrays or strings', function() {
            bigSync.__set__('config', testUtils.makeMockConfig({
                sourceLocation: null,
                destinationLocation: null
            }));
            expect(bigSync).to.throw(Error);
        });

        it('should throw an exception when source/destination locations are not the same length', function() {
            bigSync.__set__('config', testUtils.makeMockConfig({
                sourceLocation: ['1', '2', '3'],
                destinationLocation: ['1', '2']
            }));
            expect(bigSync).to.throw(Error);
        });
    });
});