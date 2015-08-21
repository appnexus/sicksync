var expect = require('chai').expect,
    _ = require('lodash'),
    sinon = require('sinon'),
    bigSync = require('../src/big-sync');

var mockConfig = {
    username: 'joel',
    excludes: ['one', 'two', 'three'],
    sourceLocation: '/some/file/path',
    hostname: 'myCoolHost',
    destinationLocation: '/some/where/out/there'
};

var rsyncSpies = {
    shell: sinon.stub().returnsThis(),
    flags: sinon.stub().returnsThis(),
    exclude: sinon.stub().returnsThis(),
    source: sinon.stub().returnsThis(),
    destination: sinon.stub().returnsThis(),
    output: sinon.stub().returnsThis(),
    set: sinon.stub().returnsThis(),
    progress: sinon.stub().returnsThis(),
    execute: sinon.stub().callsArg(0),
    resetAll: function() {
        _.forIn(rsyncSpies, function(method, key) {
            if (key !== 'resetAll') method.reset();
        });
    }
};

var utilSpy = {
    log: sinon.spy(),
    generateLog: sinon.stub().returns(function() { 
        utilSpy.log.apply(null, arguments); 
    }),
    ensureTrailingSlash: sinon.stub().returnsArg(0),
    resetAll: function() {
        _.forIn(utilSpy, function(method, key) {
            if (key !== 'resetAll') method.reset();
        });
    }
};

function RsyncMockConstructor() {
    return rsyncSpies;
}

describe('bigSync', function() {
    var oldUtil = bigSync.__get__('util');
    var oldRsync = bigSync.__get__('Rsync');

    beforeEach(function() {
        bigSync.__set__('Rsync', RsyncMockConstructor);
        bigSync.__set__('util', utilSpy);
    });

    afterEach(function() {
        bigSync.__set__('util', oldUtil);
        bigSync.__set__('Rsync', oldRsync);
        rsyncSpies.resetAll();
        utilSpy.resetAll();
    });

    describe('when executed', function() {

        beforeEach(function(done) {
            bigSync(mockConfig, done);
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
            var destination = mockConfig.username + '@' + mockConfig.hostname + ':' + mockConfig.destinationLocation;
            expect(destination).to.equal(rsyncSpies.destination.lastCall.args[0]);
        });

        it('should set the deletion flag', function() {
            expect('delete').to.equal(rsyncSpies.set.lastCall.args[0]);
        });
    });

    describe('optional params', function () {
        describe('when debug is `true`', function () {
            beforeEach(function(done) {
                bigSync(mockConfig, { debug: true }, done);
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
                bigSync(mockConfig, { dry: true }, done);
            });

            it('should set the rsync command to run dry', function() {
                expect(rsyncSpies.set.lastCall.args[0]).to.equal('dry-run');
            });
        });

        describe('when no callback is handed', function () {
            it('should still function properly', function() {
                expect(function() {
                    bigSync(mockConfig);
                }).to.not.throw(Error);
            });
        });
    });
});