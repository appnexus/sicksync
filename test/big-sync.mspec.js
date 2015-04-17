var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    bigSync = rewire('../lib/big-sync');

var mockConfig = {
    excludes: ['one', 'two', 'three'],
    sourceLocation: '/some/file/path',
    hostname: 'myCoolHost',
    destinationLocation: '/some/where/out/there'
};

var rsyncSpies = (function() {
    function BuildSpies() {}

    BuildSpies.prototype.shell = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.flags = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.exclude = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.source = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.destination = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.execute = function(cb) { cb(); };
    BuildSpies.prototype.resetAll = function() {
        BuildSpies.prototype.shell.reset();
        BuildSpies.prototype.flags.reset();
        BuildSpies.prototype.exclude.reset();
        BuildSpies.prototype.source.reset();
        BuildSpies.prototype.destination.reset();
    };

    return new BuildSpies();
})();

function RsyncMockConstructor() {
    return rsyncSpies;
}

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
            expect(consoleSpy.log.getCall(0).args[0]).to.contain('--setup');
        });
    });

    describe('when executed', function() {

        beforeEach(function(done) {
            bigSync.__set__('Rsync', RsyncMockConstructor);
            bigSync.__set__('config', mockConfig);
            bigSync(done);
        });

        afterEach(function() {
            rsyncSpies.resetAll();
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
            expect(mockConfig.sourceLocation).to.equal(rsyncSpies.source.getCall(0).args[0]);
        });

        it('should set the `destination` property to match the on one in the config', function() {
            var destination = mockConfig.hostname + ':' + mockConfig.destinationLocation;
            expect(destination).to.equal(rsyncSpies.destination.getCall(0).args[0]);
        });
    });
});