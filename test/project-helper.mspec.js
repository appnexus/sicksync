var expect = require('chai').expect,
    proxyquire = require('proxyquire'),

    // Mocks
    mockUtil = require('./stubs/util'),
    consoleMock = require('./stubs/console'),

    projectHelper = proxyquire('../src/project-helper', {
        './util': mockUtil
    });

describe('Project-Helper', function () {
    before(function() {
        consoleMock.inject();
    });

    after(function() {
        consoleMock.restore();
    });

    afterEach(function() {
        consoleMock.resetAll();
        mockUtil.resetAll();
    });

    describe('#add', function () {
        it('query for all information, including globals, on new installs', function() {
            projectHelper.add({});

            expect(mockUtil._prompt.get.lastCall.args[0].properties).to.have.all.keys(
                'project',
                'hostname',
                'username',
                'sourceLocation',
                'destinationLocation',
                'excludes',
                'prefersEncrypted',
                'websocketPort',
                'followSymLinks',
                'retryOnDisconnect',
                'debug'
            );
        });

        it('should query for only project-related information on current installs', function() {
            projectHelper.add({ retryOnDisconnect: true, debug: true });

            expect(mockUtil._prompt.get.lastCall.args[0].properties).to.have.all.keys(
                'project',
                'hostname',
                'username',
                'sourceLocation',
                'destinationLocation',
                'excludes',
                'prefersEncrypted',
                'websocketPort',
                'followSymLinks'
            );
        });

        it('should log an error message if there was a problem getting the project info', function() {
            var errorText = 'User canceled';

            projectHelper.add({ retryOnDisconnect: true, debug: true });
            // Trigger a failure
            mockUtil._prompt.get.lastCall.args[1](errorText);
            expect(console.info.lastCall.args[0]).to.contain(errorText);
        });

        it('provide a helper function for creating excludes', function() {
            var excludesHelper = null;
            
            projectHelper.add({});
            
            excludesHelper = mockUtil._prompt.get.lastCall.args[0].properties.excludes.before;
            
            expect(excludesHelper('one,two')).to.eql(['one', 'two']);
        });

        describe('on success', function () {
            it('set globals if they weren\'t present, and adds a project', function() {
                var writeConfigCall = null;
                var result = {
                    project: 'joels thing',
                    hostname: 'myhost',
                    debug: true,
                    retryOnDisconnect: true
                };

                projectHelper.add({});
                // Trigger success
                mockUtil._prompt.get.lastCall.args[1](null, result);
                writeConfigCall = mockUtil.writeConfig.lastCall.args[0];

                expect(writeConfigCall.debug).to.be.true;
                expect(writeConfigCall.retryOnDisconnect).to.be.true;
                expect(writeConfigCall.projects[0].project).to.equal(result.project);
                expect(writeConfigCall.projects[0].hostname).to.equal(result.hostname);
                expect(writeConfigCall.projects[0].debug).to.be.a('undefined');
                expect(writeConfigCall.projects[0].retryOnDisconnect).to.be.a('undefined');
                expect(writeConfigCall.version).to.not.be.a('undefined');
            });

            it('should not set globals if they were already there', function() {
                var writeConfigCall = null;
                var result = {
                    project: 'joels thing',
                    hostname: 'myhost',
                    debug: true,
                    retryOnDisconnect: true
                };

                projectHelper.add({
                    debug: false,
                    retryOnDisconnect: false
                });

                // Trigger success
                mockUtil._prompt.get.lastCall.args[1](null, result);
                writeConfigCall = mockUtil.writeConfig.lastCall.args[0];

                expect(writeConfigCall.debug).to.be.false;
                expect(writeConfigCall.retryOnDisconnect).to.be.false;
            });
        });
    });

    describe('#remove', function () {
        it('should remove project(s) from the config if it finds them', function() {
            var projectsToRemove = ['one', 'two'];
            var config = {
                projects: [{
                    project: 'one'
                }, {
                    project: 'two'
                }, {
                    project: 'three'
                }]
            };

            projectHelper.remove(config, projectsToRemove);

            expect(mockUtil.writeConfig.lastCall.args[0].projects).to.have.length(1);
        });

        it('should do nothing for projects it cannot find', function() {
            var projectsToRemove = ['not there'];
            var config = {
                projects: [{
                    project: 'one'
                }, {
                    project: 'two'
                }, {
                    project: 'three'
                }]
            };

            projectHelper.remove(config, projectsToRemove);

            expect(mockUtil.writeConfig.lastCall.args[0].projects).to.have.length(3);
        });
    });

    describe('#info', function () {
        it('should print a helpful message if there are no projects', function() {
            projectHelper.info({}, 'my project');

            expect(console.info.lastCall.args[0]).to.contain('No projects!');
        });

        it('should print information for all projects if no project is passed', function() {
            var config = {
                projects: [{
                    project: 'joels deal',
                    host: 'my-host'
                }]
            };

            projectHelper.info(config);

            expect(console.info.lastCall.args[1]).to.contain('Host');
            expect(console.info.lastCall.args[2]).to.contain('my-host');
        });

        it('should print information only the project specified if passed', function() {
            var config = {
                projects: [{
                    project: 'joels deal',
                    host: 'my-host'
                }, {
                    project: 'ignore me',
                    host: 'shouldnt pring'
                }]
            };

            projectHelper.info(config, ['joels deal']);

            expect(console.info.lastCall.args[1]).to.contain('Host');
            expect(console.info.lastCall.args[2]).to.contain('my-host');
        });
    });
});
