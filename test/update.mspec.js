var expect = require('chai').expect,
    proxyquire = require('proxyquire'),

    // Stubs
    fsStub = require('./stubs/fs'),
    utilStub = require('./stubs/util'),
    childStub = require('./stubs/child-process'),
    latestVersionStub = require('./stubs/latest-version'),

    // Inject
    update = proxyquire('../src/update', {
        'child_process': childStub,
        'latest-version': latestVersionStub,
        './util': utilStub,
        'fs-extra': fsStub
    });

var configV1 = {
    retryOnDisconnect: true,
    debug: true,
    sourceLocation: 'my/project',
    destinationLocation: 'somewhere/outthere',
    hostname: 'myhost',
    userName: 'Joel',
    excludes: [
        '.git/**',
        '.idea/**',
        'v2/public/bundles2/**',
        '**.swp'
    ],
    'prefersEncrypted': false,
    'websocketPort': '8675',
    'followSymLinks': false,
    'project': 'hbui-src'
};

describe('Update', function () {

    afterEach(function () {
        fsStub.resetAll();
        utilStub.resetAll();
        childStub.resetAll();
        latestVersionStub.resetAll();    
    });

    describe('#migrate1to2', function () {
        it('should make the retryOnDisconnect and debug flags global', function() {
            expect(update.migrate1to2(configV1).debug).to.equal(configV1.debug);
            expect(update.migrate1to2(configV1).retryOnDisconnect).to.equal(configV1.retryOnDisconnect);
        });

        it('should migrate userName to username', function() {
            expect(update.migrate1to2(configV1).projects[0].username).to.equal(configV1.userName);
            expect(update.migrate1to2(configV1).projects[0].userName).to.be.an('undefined');
        });

        it('should create a `project` property for the single project', function() {
            expect(update.migrate1to2(configV1).projects[0].project).to.equal('project');
        });

        it('should copy all other properties to that projects definition', function() {
            expect(update.migrate1to2(configV1).projects[0]).to.have.keys(
                'project',
                'sourceLocation',
                'destinationLocation',
                'hostname',
                'username',
                'excludes',
                'prefersEncrypted',
                'websocketPort',
                'followSymLinks'
            );
        });
    });

    describe('#migrateConfig', function() {
        it('should only migrate configs if they have no versions appended to them', function() {
            update.migrateConfig({
                version: '3.4.5'
            });

            expect(utilStub.writeConfig.called).to.be.false;
        });

        it('should migrate the config if it has no version information', function() {
            update.migrateConfig(configV1);

            expect(utilStub.writeConfig.called).to.be.true;
        });
    });

    describe('#check', function() {
        it('should check if there is a new update only when necessary', function() {
            update.check();

            expect(latestVersionStub.lastCall.args[0]).to.equal('sicksync');
            expect(latestVersionStub.lastCall.args[1]).to.be.a('function');
        });

        it('should save any information when checking', function() {
            update.check();
            latestVersionStub.lastCall.args[1](null, '2.0.0'); // Trigger the callback

            expect(utilStub.getUpdatePath.called).to.be.true;
            expect(JSON.parse(fsStub.writeFileSync.lastCall.args[1]).version).to.equal('2.0.0');
        });

        it('should do nothing if there was a problem checking', function() {
            update.check();
            latestVersionStub.lastCall.args[1]('Your machine is the dead'); // Trigger the callback

            expect(fsStub.writeFileSync.called).to.be.false;
        });
    });
});
