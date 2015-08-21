var _ = require('lodash'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    util = require('../../src/util'),
    FSHelper = require('../../src/remote/fs-helper');

// Mocks
var fsMock = {
    outputFile: sinon.spy(),
    mkdirs: sinon.spy(),
    delete: sinon.spy()
};

// Inject Mocks
FSHelper.__set__('fs', fsMock);

var addTest = {
    destinationpath: '~/Projects',
    contents: 'pretty cool'
};

var addDirTest = {
    destinationpath: '~/Projects'
};

describe('remote fs-helper', function () {
    var fsHelper = null;

    beforeEach(function () {
        fsHelper = new FSHelper();
    });

    describe('#addFile', function () {
        it('should untildify the file', function() {
            fsHelper.addFile(addTest);

            expect(fsMock.outputFile.lastCall.args[0]).to.equal(util.getHome() + addTest.destinationpath.replace('~', ''));
        });

        it('should pass the contents to the fs-extra write', function() {
            fsHelper.addFile(addTest);

            expect(fsMock.outputFile.lastCall.args[1]).to.eql(addTest.contents);
        });

        it('should emit an event when the file has written successfully', function(done) {
            fsHelper.on('add-file', _.ary(done, 0));
            fsHelper.addFile(addTest);

            fsMock.outputFile.lastCall.args[2](null);
        });

        it('should emit an event when the file wasn\'t written', function(done) {
            fsHelper.on('add-file-error', _.ary(done, 0));
            fsHelper.addFile(addTest);

            fsMock.outputFile.lastCall.args[2]('File not written');
        });
    });

    describe('#addDir', function () {
        it('should untildify the file', function() {
            fsHelper.addDir(addDirTest);

            expect(fsMock.mkdirs.lastCall.args[0]).to.equal(util.getHome() + addDirTest.destinationpath.replace('~', ''));
        });

        it('should emit an event when the file has written successfully', function(done) {
            fsHelper.on('add-dir', _.ary(done, 0));
            fsHelper.addDir(addDirTest);

            fsMock.mkdirs.lastCall.args[1](null);
        });

        it('should emit an event when the file wasn\'t written', function(done) {
            fsHelper.on('add-dir-error', _.ary(done, 0));
            fsHelper.addDir(addDirTest);

            fsMock.mkdirs.lastCall.args[1]('File not written');
        });
    });

    describe('#removePath', function () {
        it('should untildify the file', function() {
            fsHelper.removePath(addDirTest);

            expect(fsMock.delete.lastCall.args[0]).to.equal(util.getHome() + addDirTest.destinationpath.replace('~', ''));
        });

        it('should emit an event when the file has written successfully', function(done) {
            fsHelper.on('delete', _.ary(done, 0));
            fsHelper.removePath(addDirTest);

            fsMock.delete.lastCall.args[1](null);
        });

        it('should emit an event when the file wasn\'t written', function(done) {
            fsHelper.on('delete-error', _.ary(done, 0));
            fsHelper.removePath(addDirTest);

            fsMock.delete.lastCall.args[1]('File not written');
        });
    });
});