import _ from 'lodash';
import { expect } from 'chai';
import fsStub from '../stubs/fs';
import untildify from 'untildify';
import proxyquire from 'proxyquire';

const FSHelper = proxyquire('../../src/remote/fs-helper', {
  'fs-extra': fsStub,
});

const addTest = {
  destinationpath: '~/Projects',
  contents: 'pretty cool',
};

const addDirTest = {
  destinationpath: '~/Projects',
};

describe('remote fs-helper', function() {
  let fsHelper = null;

  beforeEach(function() {
    fsHelper = new FSHelper();
  });

  afterEach(function() {
    fsStub.resetAll();
  });

  describe('#addFile', function() {
    it('should untildify the file', function() {
      fsHelper.addFile(addTest);
      expect(fsStub.outputFile.lastCall.args[0]).to.equal(untildify(addTest.destinationpath));
    });

    it('should pass the contents to the fs-extra write', function() {
      fsHelper.addFile(addTest);

      expect(fsStub.outputFile.lastCall.args[1]).to.eql(addTest.contents);
    });

    it('should emit an event when the file has written successfully', function(done) {
      fsHelper.on('add-file', _.ary(done, 0));
      fsHelper.addFile(addTest);

      fsStub.outputFile.lastCall.args[2](null);
    });

    it('should emit an event when the file wasn\'t written', function(done) {
      fsHelper.on('add-file-error', _.ary(done, 0));
      fsHelper.addFile(addTest);

      fsStub.outputFile.lastCall.args[2]('File not written');
    });
  });

  describe('#addDir', function() {
    it('should untildify the file', function() {
      fsHelper.addDir(addDirTest);

      expect(fsStub.mkdirs.lastCall.args[0]).to.equal(untildify(addDirTest.destinationpath));
    });

    it('should emit an event when the file has written successfully', function(done) {
      fsHelper.on('add-dir', _.ary(done, 0));
      fsHelper.addDir(addDirTest);

      fsStub.mkdirs.lastCall.args[1](null);
    });

    it('should emit an event when the file wasn\'t written', function(done) {
      fsHelper.on('add-dir-error', _.ary(done, 0));
      fsHelper.addDir(addDirTest);

      fsStub.mkdirs.lastCall.args[1]('File not written');
    });
  });

  describe('#removePath', function() {
    it('should untildify the file', function() {
      fsHelper.removePath(addDirTest);

      expect(fsStub.delete.lastCall.args[0]).to.equal(untildify(addDirTest.destinationpath));
    });

    it('should emit an event when the file has written successfully', function(done) {
      fsHelper.on('delete', _.ary(done, 0));
      fsHelper.removePath(addDirTest);

      fsStub.delete.lastCall.args[1](null);
    });

    it('should emit an event when the file wasn\'t written', function(done) {
      fsHelper.on('delete-error', _.ary(done, 0));
      fsHelper.removePath(addDirTest);

      fsStub.delete.lastCall.args[1]('File not written');
    });
  });
});
