import _ from 'lodash';
import { expect } from 'chai';

import proxyquire from 'proxyquire';
import chokidarStub from '../stubs/chokidar';
import fsStub from '../stubs/fs';

const { FSHelper } = proxyquire('../../src/local/fs-helper', {
  chokidar: chokidarStub,
  fs: fsStub,
});

const config = {
  sourceLocation: 'my/home/',
  destinationLocation: 'my/remote/box/',
  excludes: ['.git'],
};

describe('local fs-helper', function() {
  let fsHelper = null;

  beforeEach(function() {
    fsHelper = new FSHelper(config);
  });

  afterEach(function() {
    fsStub.resetAll();
    chokidarStub.resetAll();
  });

  describe('#watch', function() {
    it('should watch the source directory', function() {
      fsHelper.watch();
      expect(chokidarStub.watch.lastCall.args[0]).to.equal(config.sourceLocation);
    });

    it('should pass a list of ignored files to the watcher', function() {
      fsHelper.watch();
      expect(chokidarStub.watch.lastCall.args[1].ignored).to.eql(config.excludes);
    });

    it('should persist the watch', function() {
      fsHelper.watch();
      expect(chokidarStub.watch.lastCall.args[1].persistent).to.be.true;
    });

    it('should pass in a flag for symlinks', function() {
      fsHelper.watch();
      expect(chokidarStub.watch.lastCall.args[1].followSymlinks).to.equal(config.followSymlinks);
    });

    it('should pass in an empty array of ignores if none are there', function() {
      const noExcludesConfig = _.clone(config);

      delete noExcludesConfig.excludes;

      fsHelper = new FSHelper(noExcludesConfig);
      expect(chokidarStub.watch.lastCall.args[1].ignored).to.eql([]);
    });

    describe('#on', function() {
      beforeEach(function() {
        fsHelper.watch();
      });

      it('should register an `all` callback', function() {
        expect(chokidarStub._api.on.lastCall.args[0]).to.equal('all');
      });

      it('should pass in a function for the `all` callback', function() {
        expect(chokidarStub._api.on.lastCall.args[1]).to.be.a('function');
      });
    });

    describe('fs events', function() {
      const localPath = 'file/path';

      beforeEach(function() {
        fsHelper.watch();
      });

      it('should pass along the file contents', function(done) {
        fsHelper.once('file-change', function(data) {
          expect(data.contents).to.be.a('string');
          expect(data.localpath).to.equal(config.sourceLocation + localPath);
          expect(data.relativepath).to.equal(localPath);
          done();
        });
        chokidarStub.triggerFsEvent('add', config.sourceLocation + localPath);
      });

      it('should not pass along the file contents if the event isn\'t add or change', function(done) {
        fsHelper.once('file-change', function(data) {
          expect(data.contents).to.be.null;
          done();
        });
        chokidarStub.triggerFsEvent('unlink', config.sourceLocation + localPath);
      });

      it('should not emit events for files that are ignored', function() {
        fsHelper.once('file-change', function() {
          expect.fail('File changes shouldn\'t happen when ignored.');
        });
        chokidarStub.triggerFsEvent('unlink', config.sourceLocation + '.git');
      });

      it('should not emit events when the watch is paused', function() {
        fsHelper.once('file-change', function() {
          expect.fail('File changes shouldn\'t happen when paused.');
        });
        fsHelper.pauseWatch();
        chokidarStub.triggerFsEvent('unlink', config.sourceLocation + localPath);
      });

      it('should emit events when unpaused', function(done) {
        fsHelper.once('file-change', function(data) {
          expect(data.relativepath).to.contain(localPath);
          done();
        });
        fsHelper.pauseWatch();
        fsHelper.watch();
        chokidarStub.triggerFsEvent('unlink', config.sourceLocation + localPath);
      });
    });
  });
});
