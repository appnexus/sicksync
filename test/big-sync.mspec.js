var expect = require('chai').expect,
    _ = require('lodash'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    bigSync = rewire('../lib/big-sync');

var mockConfig = {
    excludes: ['one', 'two', 'three'],
    sourceLocation: '/some/file/path',
    hostname: 'myCoolHost',
    destinationLocation: '/some/where/out/there'
};

var debugConfig = _.merge({}, mockConfig, { debug: true });

var rsyncSpies = (function() {
    function BuildSpies() {}

    BuildSpies.prototype.shell = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.flags = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.exclude = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.source = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.destination = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.output = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.set = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.execute = function(cb) { cb(); };
    BuildSpies.prototype.resetAll = function() {
        BuildSpies.prototype.shell.reset();
        BuildSpies.prototype.flags.reset();
        BuildSpies.prototype.exclude.reset();
        BuildSpies.prototype.source.reset();
        BuildSpies.prototype.destination.reset();
        BuildSpies.prototype.set.reset();
        BuildSpies.prototype.output.reset();
    };

    return new BuildSpies();
})();

function RsyncMockConstructor() {
    return rsyncSpies;
}

describe('bigSync', function() {
    var oldConsole = bigSync.__get__('console');
    var consoleSpy = {
        log: sinon.spy()
    };

    beforeEach(function() {
        bigSync.__set__('console', consoleSpy);
    });

    afterEach(function() {
        bigSync.__set__('console', oldConsole);
        rsyncSpies.resetAll();
        consoleSpy.log.reset();
    });

    it('should be a function', function() {
        expect(bigSync).to.be.a.function;
    });

    describe('when config is empty', function() {
        beforeEach(function() {
            bigSync.__set__('config', {});
        });

        it('should log a message to run `sicksync --setup`', function() {
            bigSync();
            expect(consoleSpy.log.lastCall.args[0]).to.contain('--setup');
        });
    });

    describe('when executed', function() {

        beforeEach(function(done) {
            bigSync.__set__('Rsync', RsyncMockConstructor);
            bigSync.__set__('config', mockConfig);
            bigSync(done);
        });

        it('should set the `shell` property to `ssh`', function() {
            expect('ssh').to.equal(rsyncSpies.shell.lastCall.args[0]);
        });

        it('should set the `flags` property to `az`', function() {
            expect('az').to.equal(rsyncSpies.flags.lastCall.args[0]);
        });

        it('should set the `exclude` property to match the one in config', function() {
            expect(mockConfig.excludes).to.deep.equal(rsyncSpies.exclude.lastCall.args[0]);
        });

        it('should set the `source` property to match the on one in the config', function() {
            expect(mockConfig.sourceLocation).to.equal(rsyncSpies.source.lastCall.args[0]);
        });

        it('should set the `destination` property to match the on one in the config', function() {
            var destination = mockConfig.hostname + ':' + mockConfig.destinationLocation;
            expect(destination).to.equal(rsyncSpies.destination.lastCall.args[0]);
        });

        it('should set the deletion flag', function() {
            expect('delete').to.equal(rsyncSpies.set.lastCall.args[0]);
        });
    });

    describe('when `debug` is true', function () {
        beforeEach(function(done) {
            bigSync.__set__('Rsync', RsyncMockConstructor);
            bigSync.__set__('config', debugConfig);
            bigSync(done);
        });

        it('should set the `progress` flag', function() {
            expect('progress').to.equal(rsyncSpies.set.getCall(1).args[0]);
        });

        it('should pass in a function to log the status messages', function() {
            expect(rsyncSpies.output.lastCall.args[0]).to.be.a('function');
        });

        it('should pass in a function to log the error messages', function() {
            expect(rsyncSpies.output.lastCall.args[1]).to.be.a('function');
        });

        it('should output the status messages', function() {
            var message = 'Processing';
            rsyncSpies.output.lastCall.args[0](new Buffer(message));

            expect(consoleSpy.log.lastCall.args[0]).to.equal(message);
        });

        it('should output the error messages', function() {
            var message = 'Processing';
            rsyncSpies.output.lastCall.args[1](new Buffer(message));

            expect(consoleSpy.log.lastCall.args[0]).to.equal(message);
        });
    });
});