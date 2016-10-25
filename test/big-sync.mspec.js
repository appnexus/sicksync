import { expect } from 'chai';
import proxyquire from 'proxyquire';

// Mocks
import rsyncStub from './stubs/rsync';
import utilStub from './stubs/util';

// Inject
const bigSync = proxyquire('../src/big-sync', {
  'rsync': rsyncStub,
  './util': utilStub,
});

const testConfig = {
  username: 'joel',
  excludes: ['one', 'two', 'three'],
  sourceLocation: '/some/file/path',
  hostname: 'myCoolHost',
  destinationLocation: '/some/where/out/there',
};

describe('bigSync', function() {

  afterEach(function() {
    rsyncStub.resetAll();
    utilStub.resetAll();
  });

  describe('when executed', function() {

    beforeEach(function(done) {
      bigSync(testConfig, done);
    });

    it('should set the `shell` property to `ssh`', function() {
      expect('ssh').to.equal(rsyncStub._api.shell.lastCall.args[0]);
    });

    it('should set the `flags` property to `az`', function() {
      expect('az').to.equal(rsyncStub._api.flags.lastCall.args[0]);
    });

    it('should set the `exclude` property to match the one in config', function() {
      expect(testConfig.excludes).to.deep.equal(rsyncStub._api.exclude.lastCall.args[0]);
    });

    it('should set the `source` property to match the on one in the config and append a trailing slash', function() {
      expect(testConfig.sourceLocation + '/').to.equal(rsyncStub._api.source.lastCall.args[0]);
    });

    it('should set the `destination` property to match the on one in the config', function() {
      const destination = testConfig.username + '@' + testConfig.hostname + ':' + testConfig.destinationLocation;
      expect(destination).to.equal(rsyncStub._api.destination.lastCall.args[0]);
    });

    it('should set the deletion flag', function() {
      expect('delete').to.equal(rsyncStub._api.set.lastCall.args[0]);
    });
  });

  describe('optional params', function() {
    describe('when debug is `true`', function() {
      beforeEach(function(done) {
        bigSync(testConfig, { debug: true }, done);
      });

      it('should set the `progress` flag', function() {
        expect(rsyncStub._api.progress.called).to.be.true;
      });

      it('should pass in a function to log the status messages', function() {
        expect(rsyncStub._api.output.lastCall.args[0]).to.be.a('function');
      });

      it('should pass in a function to log the error messages', function() {
        expect(rsyncStub._api.output.lastCall.args[1]).to.be.a('function');
      });

      it('should output the status messages', function() {
        const message = 'Processing';
        rsyncStub._api.output.lastCall.args[0](new Buffer(message));

        expect(utilStub.logSpy.lastCall.args[0]).to.contain(message);
      });

      it('should output the error messages', function() {
        const message = 'Processing';
        rsyncStub._api.output.lastCall.args[1](new Buffer(message));

        expect(utilStub.logSpy.lastCall.args[0]).to.contain(message);
      });
    });

    describe('when `isDryRun` is true', function() {
      beforeEach(function(done) {
        bigSync(testConfig, { dry: true }, done);
      });

      it('should set the rsync command to run dry', function() {
        expect(rsyncStub._api.set.lastCall.args[0]).to.equal('dry-run');
      });
    });

    describe('when no callback is handed', function() {
      it('should still function properly', function() {
        expect(function() {
          bigSync(testConfig);
        }).to.not.throw(Error);
      });
    });
  });
});
