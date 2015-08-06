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
    BuildSpies.prototype.progress = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.dry = sinon.stub().returns(BuildSpies.prototype);
    BuildSpies.prototype.execute = function(cb) { cb(); };
    BuildSpies.prototype.resetAll = function() {
        BuildSpies.prototype.shell.reset();
        BuildSpies.prototype.flags.reset();
        BuildSpies.prototype.exclude.reset();
        BuildSpies.prototype.source.reset();
        BuildSpies.prototype.destination.reset();
        BuildSpies.prototype.set.reset();
        BuildSpies.prototype.output.reset();
        BuildSpies.prototype.dry.reset();
        BuildSpies.prototype.progress.reset();
    };

    return new BuildSpies();
})();

function RsyncMockConstructor() {
    return rsyncSpies;
}

describe('bigSync', function() {
    var oldUtil = bigSync.__get__('util');
    var utilSpy = {
        log: sinon.spy()
    };

    beforeEach(function() {
        bigSync.__set__('util', utilSpy);
    });

    afterEach(function() {
        bigSync.__set__('util', oldUtil);
        rsyncSpies.resetAll();
        utilSpy.log.reset();
    });

    it('should be a function', function() {
        expect(bigSync).to.be.a.function;
    });

    describe('when config is empty', function() {
        beforeEach(function() {
            bigSync.__set__('config', {});
        });

        it('should log a message to run `sicksync setup`', function() {
            bigSync();
            expect(utilSpy.log.lastCall.args[0]).to.contain('sicksync setup');
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

    describe('optional params', function () {
        beforeEach(function() {
            bigSync.__set__('Rsync', RsyncMockConstructor);
            bigSync.__set__('config', debugConfig);
        });

        describe('when debug is `true`', function () {
            beforeEach(function(done) {
                bigSync({ debug: true }, done);
            });

            it('should set the `progress` flag', function() {
                expect(rsyncSpies.progress.called).to.be.true;
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

                expect(utilSpy.log.lastCall.args[0]).to.contain(message);
            });

            it('should output the error messages', function() {
                var message = 'Processing';
                rsyncSpies.output.lastCall.args[1](new Buffer(message));

                expect(utilSpy.log.lastCall.args[0]).to.contain(message);
            });
        });

        describe('when `isDryRun` is true', function () {
            beforeEach(function(done) {
                bigSync({ isDryRun: true }, done);
            });

            it('should set the rsync command to run dry', function() {
                expect(rsyncSpies.dry.called).to.be.true;
            });
        });

        describe('when no callback is handed', function () {
            it('should still function properly', function() {
                expect(bigSync).to.not.throw(Error);
            });
        });
    });
});