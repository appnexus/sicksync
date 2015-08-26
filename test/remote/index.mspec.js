var _ = require('lodash'),
    expect = require('chai').expect,
    proxyquire = require('proxyquire'),
    wsStub = require('../stubs/ws-server'),

    // Stubs
    fsHelperStub = require('../stubs/server-fs-helper'),
    consoleStub = require('../stubs/console'),
    processStub = require('../stubs/process'),
    
    // Inject
    remote = proxyquire('../../src/remote', {
        './fs-helper': fsHelperStub,
        './ws-server': wsStub
    });

// Test Data
var serverOpts = {
    port: 1234,
    secret: 'dirty-little',
    debug: true,
    encrypt: false
};

describe('Remote Entry (index.js)', function () {
    before(function() {
        processStub.inject();
        consoleStub.inject();
    });

    after(function() {
        processStub.restore();
        consoleStub.restore();
    });

    afterEach(function() {
        fsHelperStub.resetAll();
        consoleStub.resetAll();
        processStub.resetAll();
    });

    it('should warn when the there is no port passed in', function() {
        remote({
            secret: 'my-secret'
        });

        expect(console.info.lastCall.args[0]).to.contain('-port, -p, is required');
    });

    it('should warn when the there is no secret passed in', function() {
        remote({
            port: 1234
        });

        expect(console.info.lastCall.args[0]).to.contain('--secret, -s, is required');
    });

    describe('Server Events', function () {
        beforeEach(function () {
            remote(serverOpts);            
        });

        it('should log a message and exit if an unauthorized message happens', function() {
            wsStub.triggerEvent('unauthorized');

            expect(processStub.exit.called).to.be.true;
            expect(console.info.lastCall.args.join(' ')).to.contain('Unauthorized connection, shutting down');
        });

        it('should log a message and exit if the client disconnects', function() {
            wsStub.triggerEvent('connection-closed');

            expect(processStub.exit.called).to.be.true;
            expect(console.info.lastCall.args.join(' ')).to.contain('Connection closed, shutting down');
        });

        describe('file-change events', function () {
            it('should pass along `add` changeType\'s to addFile', function() {
                var message = {
                    changeType: 'add'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.addFile.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `addDir` changeType\'s to addDir', function() {
                var message = {
                    changeType: 'addDir'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.addDir.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `change` changeType\'s to addFile', function() {
                var message = {
                    changeType: 'change'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.addFile.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlink` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlink'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlink` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlink'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should pass along `unlinkDir` changeType\'s to removePath', function() {
                var message = {
                    changeType: 'unlinkDir'
                };
                wsStub.triggerEvent('file-change', message);
                expect(fsHelperStub._api.removePath.lastCall.args[0]).to.eql(message);
            });

            it('should do nothing if the change type isn\'t known', function() {
                var message = {
                    changeType: 'wat!!'
                };
                wsStub.triggerEvent('file-change', message);

                _.forIn(fsHelperStub._api, function(method, name) {
                    if (name !== 'on') expect(method.called).to.be.false;
                });
            });
        });
    });

    describe('File Events', function () {
        beforeEach(function () {
            remote(serverOpts);
        });

        it('should log files that have been added', function() {
            fsHelperStub.triggerFSCall('add-file', 'add');

            expect(console.info.lastCall.args.join()).to.contain('<');
            expect(console.info.lastCall.args.join()).to.contain('add');
        });

        it('should log directories that have been added', function() {
            fsHelperStub.triggerFSCall('add-dir', 'dir');

            expect(console.info.lastCall.args.join()).to.contain('<');
            expect(console.info.lastCall.args.join()).to.contain('dir');
        });

        it('should log files/dirs that have been deleted', function() {
            fsHelperStub.triggerFSCall('delete', 'delete');

            expect(console.info.lastCall.args.join()).to.contain('<');
            expect(console.info.lastCall.args.join()).to.contain('delete');
        });

        it('should log error files that have been added', function() {
            fsHelperStub.triggerFSCall('add-file-error', 'add');

            expect(console.info.lastCall.args.join()).to.contain('ERR');
            expect(console.info.lastCall.args.join()).to.contain('add');
        });

        it('should log error directories that have been added', function() {
            fsHelperStub.triggerFSCall('add-dir-error', 'dir');

            expect(console.info.lastCall.args.join()).to.contain('ERR');
            expect(console.info.lastCall.args.join()).to.contain('dir');
        });

        it('should log error files/dirs that have been deleted', function() {
            fsHelperStub.triggerFSCall('delete-error', 'delete');

            expect(console.info.lastCall.args.join()).to.contain('ERR');
            expect(console.info.lastCall.args.join()).to.contain('delete');
        });
    });
});
