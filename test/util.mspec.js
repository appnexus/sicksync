var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    util = rewire('../src/util');

describe('util', function() {
    describe('#getConfigPath', function() {
        it('should return a string', function() {
            expect(util.getConfigPath()).to.be.a('string');
        });

        it('should contain `json` in it\'s path', function() {
            expect(util.getConfigPath().indexOf('json') > -1).to.be.true;
        });
    });

    describe('#getConfig', function() {
        var constants = util.__get__('constants');
        var constantsMock = {
            CONFIG_FILE: 'iShouldntBeHereHopefully',
            SICKSYNC_DIR: '~/.sicksync'
        };
        var oldFs = util.__get__('fs');

        afterEach(function() {
            util.__set__('fs', oldFs);
            util.__set__('constants', constants);
        });

        it('should return an object', function() {
            expect(util.getConfig()).to.be.an('object');
        });

        it('should return an empty object if the config doesn\'t exist', function() {
            util.__set__('constants', constantsMock);
            expect(util.getConfig()).to.eql({});
        });
    });

    describe('#getUpdatePath', function () {
        it('should contain the update.json file', function() {
            expect(util.getUpdatePath()).to.contain('update.json');
        });
    });

    describe('#getId', function() {
        it('should return a string', function() {
            expect(util.getId()).to.be.a('string');
        });

        it('should return a unique value', function() {
            expect(util.getId()).to.not.equal(util.getId());
        });
    });

    describe('#writeConfig', function() {
        var outputFileSyncSpy = null;
        var consoleSpy = null;

        beforeEach(function() {
            outputFileSyncSpy = sinon.stub(util.__get__('fs'), 'outputFileSync');
            consoleSpy = sinon.stub(console, 'log');
        });

        afterEach(function() {
            outputFileSyncSpy.restore();
            consoleSpy.restore();
        });

        it('should call `fs.outputFileSync`', function() {
            util.writeConfig({
                some: 'object',
                syncsRemotely: false
            });
            expect(outputFileSyncSpy.called).to.be.true;
        });

        it('should call `fs.outputFileSyncSpy` with the right arguments', function() {
            var parsedFsCall = null;
            var configObject = {
                some: 'object',
                syncsRemotely: false
            };

            util.writeConfig(configObject);
            parsedFsCall = (JSON.parse(outputFileSyncSpy.getCall(0).args[1]));

            expect(parsedFsCall).to.be.an('object');
            expect(parsedFsCall).to.deep.equal(configObject);
            expect(outputFileSyncSpy.getCall(0).args[0]).to.contain('.sicksync/config.json');
        });
    });

    describe('#isExcluded', function() {
        it('should return true if the filepath is excluded', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'some/file/path'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.true;
        });

        it('should return true if the filepath contains text in the excluded array', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'some/**'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.true;
        });

        it('should return false if the filepath isn\'t excluded', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'another/file/path'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.false;
        });
    });

    describe('#rebounce', function() {
        var desiredFn = sinon.spy();
        var fallbackFn = sinon.spy();
        var numTimes = 4;
        var throttleTime = 10;

        describe('when `numTimes` limit isn\'t hit', function() {
            var rebouncedFn = null;

            beforeEach(function(done) {
                rebouncedFn = util.rebounce(desiredFn, fallbackFn, numTimes, throttleTime);
                rebouncedFn('one');
                rebouncedFn('two');
                rebouncedFn('three');

                setTimeout(done, throttleTime + 1);
            });

            afterEach(function() {
                desiredFn.reset();
                fallbackFn.reset();
            });

            it('should call `desiredFn` the amount of times it was invoked', function() {
                expect(desiredFn.calledThrice).to.be.true;
            });

            it('should called the `desiredFn` with the right arguments', function() {
                expect(desiredFn.getCall(0).args[0]).to.equal('one');
                expect(desiredFn.getCall(1).args[0]).to.equal('two');
                expect(desiredFn.getCall(2).args[0]).to.equal('three');
            });
        });

        describe('when `numTimes` limit is hit', function() {
            var rebouncedFn = null;

            beforeEach(function(done) {
                rebouncedFn = util.rebounce(desiredFn, fallbackFn, numTimes, throttleTime);
                rebouncedFn();
                rebouncedFn();
                rebouncedFn();
                rebouncedFn();

                setTimeout(done, throttleTime + 1);
            });

            afterEach(function() {
                desiredFn.reset();
                fallbackFn.reset();
            });

            it('should not call `desiredFn`', function() {
                expect(desiredFn.called).to.be.false;
            });

            it('should call the `fallbackFn', function() {
                expect(fallbackFn.called).to.be.true;
            });

            it('should not call `fallbackFn` more than once', function() {
                expect(fallbackFn.calledTwice).to.be.false;
            });

            it('should not call `desiredFn` after `fallbackFn` is called', function() {
                rebouncedFn();
                expect(desiredFn.called).to.be.false;
            });

            it('should not call `fallbackFn` after another call to the rebounced function', function() {
                rebouncedFn();
                expect(rebouncedFn()).to.be.a('undefined');
                expect(fallbackFn.calledTwice).to.be.false;
            });

            it('should call the `desiredFn` again after the cool-down is complete', function(done) {
                function afterCoolDown() {
                    setTimeout(function() {
                        expect(desiredFn.called).to.be.true;
                        done();
                    }, 11);
                }
                setTimeout(afterCoolDown, 11);
            });
        });

        describe('when `throttleTime` limit is hit', function() {
            var rebouncedFn = null;

            beforeEach(function(done) {
                rebouncedFn = util.rebounce(desiredFn, fallbackFn, numTimes, throttleTime);
                rebouncedFn('one');
                rebouncedFn('two');

                setTimeout(rebouncedFn, 11);
                setTimeout(done, throttleTime + 15);
            });

            afterEach(function() {
                desiredFn.reset();
                fallbackFn.reset();
            });

            it('should call `desiredFn` the number of times it was invoked', function() {
                expect(desiredFn.calledThrice).to.be.true;
            });
        });
    });

    describe('#ensureTrailingSlash', function() {
        it('should append a trailing slash if there isn\'t one', function() {
            expect(util.ensureTrailingSlash('wat')).to.equal('wat/');
        });

        it('shoud not append a trailing slash if there is already one', function() {
            expect(util.ensureTrailingSlash('wat/')).to.equal('wat/');
        });
    });

    describe('#open', function() {
        var oldExec = util.__get__('exec');
        var execSpy = null;

        beforeEach(function() {
            util.__set__('exec', sinon.stub());
            execSpy = util.__get__('exec');
        });

        afterEach(function() {
            util.__set__('exec', oldExec);
        });

        it('should call `exec`', function() {
            util.open('somefile');
            expect(execSpy.called).to.be.true;
        });

        it('should pass in parameters to the `exec` call', function() {
            util.open('somefile');
            expect(execSpy.getCall(0).args[0]).to.contain('somefile');
            expect(execSpy.getCall(0).args[0]).to.contain('open');
        });
    });

    describe('#toBoolean', function() {
        it('should convert `yes` to `true`', function() {
            expect(util.toBoolean('yes')).to.be.true;
        });

        it('should convert `y` to `true`', function() {
            expect(util.toBoolean('y')).to.be.true;
        });

        it('should conver the string `true` to `true`', function() {
            expect(util.toBoolean('true')).to.be.true;
        });

        it('should convert `no` to `false`', function() {
            expect(util.toBoolean('no')).to.be.false;
        });

        it('should convert `n` to `false`', function() {
            expect(util.toBoolean('n')).to.be.false;
        });

        it('should conver the string `false` to `false`', function() {
            expect(util.toBoolean('false')).to.be.false;
        });

        it('should return false for all other strings', function() {
            expect(util.toBoolean('')).to.be.false;
            expect(util.toBoolean('possible')).to.be.false;
        });
    });

    describe('#setupPrompter', function() {
        var promptMock = {
            start: sinon.spy()
        };

        it('should set the `message` property to an empty string', function() {
            util.setupPrompter(promptMock);
            expect(promptMock.message).to.equal('');
        });

        it('should set the `delimiter` property to an empty string', function() {
            util.setupPrompter(promptMock);
            expect(promptMock.delimiter).to.equal('');
        });

        it('should call the `start` method', function() {
            expect(promptMock.start.called).to.be.true;
        });
    });

    describe('logging utils', function () {
        var cachedConsole = console;
        var consoleMock = { log: sinon.spy() };

        beforeEach(function () {
            util.__set__('console', consoleMock);
        });

        afterEach(function() {
            util.__set__('console', cachedConsole);
            consoleMock.log.reset();
        });

        describe('#generateLog', function () {

            it('should return a logging function that prepends the project name and hostname', function() {
                var host = 'myhost';
                var project = 'myproject';
                var message = 'wat';
                util.generateLog(project, host)(message);

                expect(consoleMock.log.lastCall.args[0]).to.contain(project);
                expect(consoleMock.log.lastCall.args[1]).to.contain(host);
                expect(consoleMock.log.lastCall.args[2]).to.contain(message);
            });

            it('should treat only one argument as the hostname', function() {
                var host = 'myhost';
                util.generateLog(host)('wat');
                expect(consoleMock.log.lastCall.args[1]).to.contain(host);
            });

            it('should log message when no hosts or projects are passed in', function() {
                var message = 'wat';
                util.generateLog()(message);
                expect(consoleMock.log.lastCall.args[2]).to.contain(message);
            });
        });
        
        describe('#printLogo', function () {
            it('should pring a sweet sweet sweet logo', function() {
                util.printLogo();

                expect(consoleMock.log.called).to.be.true;
            });
        });
    });

    describe('#shellIntoRemote', function () {
        var spawnSpy = sinon.spy();
        var cachedSpawn = util.__get__('spawn');

        beforeEach(function() {
            util.__set__('spawn', spawnSpy);
        });

        afterEach(function() {
            util.__set__('spawn', cachedSpawn);
            spawnSpy.reset();
        });

        it('should shell into the remote passed and return', function() {
            var host = 'myhost';
            
            util.shellIntoRemote(host);

            expect(spawnSpy.lastCall.args[0]).to.equal('ssh');
            expect(spawnSpy.lastCall.args[1][0]).to.equal('-tt');
            expect(spawnSpy.lastCall.args[1][1]).to.equal(host);
        });
    });

    describe('#uniqInstance', function () {
        var ConstructorSpy = sinon.spy();

        afterEach(function() {
            ConstructorSpy.reset();
        });

        it('should return copies of an instance if the tokens match', function() {
            var testConstructor = util.uniqInstance('myToken', ConstructorSpy);

            testConstructor({ myToken: 'isTheSame' });
            testConstructor({ myToken: 'isTheSame' });

            expect(ConstructorSpy.calledOnce).to.be.true;
        });

        it('should return copies of an instance if the tokens match and `New` is used', function() {
            var TestConstructor = util.uniqInstance('myToken', ConstructorSpy);

            new TestConstructor({ myToken: 'isTheSame' });
            new TestConstructor({ myToken: 'isTheSame' });

            expect(ConstructorSpy.calledOnce).to.be.true;
        });

        it('should return new instances if the tokens do not match', function() {
            var testConstructor = util.uniqInstance('myToken', ConstructorSpy);

            testConstructor({ myToken: 'isNot' });
            testConstructor({ myToken: 'theSame' });

            expect(ConstructorSpy.calledTwice).to.be.true;
        });

        it('should pass through instances like normal if there are problems storing them', function() {
            var testConstructor = util.uniqInstance('tokenWontExist', ConstructorSpy);

            testConstructor({ myToken: 'isTheSame' });
            testConstructor({ myToken: 'isTheSame' });

            expect(ConstructorSpy.calledTwice).to.be.true;
        });
    });
});