var expect = require('chai').expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    util = rewire('../lib/util');

describe('util', function() {
    it('should export an object', function() {
        expect(util).to.be.an.object;
    });

    describe('#getHome', function() {
        it('should return a string', function() {
            expect(util.getHome()).to.be.a('string');
        });

        it('should append a trailing slash', function() {
            var path = util.getHome();
            var lastChar = path.substring(path.length - 1);
            expect(lastChar).to.equal('/');
        });
    });

    describe('#getConfigPath', function() {
        it('should return a string', function() {
            expect(util.getConfigPath()).to.be.a('string');
        });

        it('should contain `json` in it\'s path', function() {
            expect(util.getConfigPath().indexOf('json') > -1).to.be.true();
        });
    });

    describe('#getConfig', function() {
        it('should return an object', function() {
            expect(util.getConfig()).to.be.an('object');
        });
    });

    describe('#isEmpty', function() {
        it('should return true if it\'s passed an empty object', function() {
            expect(util.isEmpty({})).to.be.true();
        });

        it('should return false if it\'s passed a non-empty object', function() {
            expect(util.isEmpty({
                'wat': 'wat'
            })).to.be.false();
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
        var oldWriteConfigToDev = util.writeConfigToDev;
        var outputFileSyncSpy = null;
        var consoleSpy = null;

        beforeEach(function() {
            outputFileSyncSpy = sinon.stub(util.__get__('fs'), 'outputFileSync');
            util.writeConfigToDev = sinon.stub();
            consoleSpy = sinon.stub(console, 'log');
        });

        afterEach(function() {
            outputFileSyncSpy.restore();
            consoleSpy.restore();
            util.writeConfigToDev = oldWriteConfigToDev;
        });

        it('should call `fs.outputFileSync`', function() {
            util.writeConfig({
                some: 'object',
                syncsRemotely: false
            });
            expect(outputFileSyncSpy.called).to.be.true();
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
            expect(outputFileSyncSpy.getCall(0).args[0]).to.contain('.sicksync-config.json');
        });

        it('should call `fs.writeConfigToDev` if `syncsRemotely` is true', function() {
            util.writeConfig({
                some: 'object',
                syncsRemotely: true
            });
            expect(util.writeConfigToDev.called).to.be.true();
        });
    });

    describe('#writeConfigToDev', function() {
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
            util.writeConfigToDev({});
            expect(execSpy.called).to.be.true();
        });

        it('should call `exec` with the appropriate parameters', function() {
            var configObject = {
                userName: 'joel',
                hostname: 'myCoolHost'
            };

            util.writeConfigToDev(configObject);

            expect(execSpy.getCall(0).args[0]).to.contain(configObject.userName);
            expect(execSpy.getCall(0).args[0]).to.contain(configObject.hostname);
            expect(execSpy.getCall(0).args[0]).to.contain('scp');
            expect(execSpy.getCall(0).args[0]).to.contain('@');
            expect(execSpy.getCall(0).args[1]).to.be.a('function');
        });

        describe('callback', function() {
            it('should log the success when the callback is invoked', function() {
                sinon.stub(console, 'log');
                util.writeConfigToDev({});
                execSpy.getCall(0).args[1](null);

                expect(console.log.called).to.be.true();
                console.log.restore();
            });

            it('should throw an error if something happens', function() {
                util.writeConfigToDev({});
                expect(function() {
                    execSpy.getCall(0).args[1]('some error');
                }).to.throw(Error);
            });
        });
    });

    describe('#isExcluded', function() {
        it('should return true if the filepath is excluded', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'some/file/path'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.true();
        });

        it('should return true if the filepath contains text in the excluded array', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'some'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.true();
        });

        it('should return false if the filepath isn\'t excluded', function() {
            var fileToExclude = 'some/file/path';
            var pathsToExclude = [
                'another/file/path'
            ];

            expect(util.isExcluded(fileToExclude, pathsToExclude)).to.be.false();
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
                expect(desiredFn.calledThrice).to.be.true();
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
                expect(desiredFn.called).to.be.false();
            });

            it('should call the `fallbackFn', function() {
                expect(fallbackFn.called).to.be.true();
            });

            it('should not call `fallbackFn` more than once', function() {
                expect(fallbackFn.calledTwice).to.be.false();
            });

            it('should not call `desiredFn` after `fallbackFn` is called', function() {
                rebouncedFn();
                expect(desiredFn.called).to.be.false();
            });

            it('should not call `fallbackFn` after another call to the rebounced function', function() {
                rebouncedFn();
                expect(fallbackFn.calledTwice).to.be.false();
            });

            it('should call the `desiredFn` again after the cool-down is complete', function(done) {
                function afterCoolDown() {
                    setTimeout(function() {
                        expect(desiredFn.called).to.be.true();
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
                expect(desiredFn.calledThrice).to.be.true();
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
            expect(execSpy.called).to.be.true();
        });

        it('should pass in parameters to the `exec` call', function() {
            util.open('somefile');
            expect(execSpy.getCall(0).args[0]).to.contain('somefile');
            expect(execSpy.getCall(0).args[0]).to.contain('open');
        });
    });

    describe('#toBoolean', function() {
        it('should convert `yes` to `true`', function() {
            expect(util.toBoolean('yes')).to.be.true();
        });

        it('should convert `y` to `true`', function() {
            expect(util.toBoolean('y')).to.be.true();
        });

        it('should conver the string `true` to `true`', function() {
            expect(util.toBoolean('true')).to.be.true();
        });

        it('should convert `no` to `false`', function() {
            expect(util.toBoolean('no')).to.be.false();
        });

        it('should convert `n` to `false`', function() {
            expect(util.toBoolean('n')).to.be.false();
        });

        it('should conver the string `false` to `false`', function() {
            expect(util.toBoolean('false')).to.be.false();
        });
    });

    describe('#wakeDevBox', function() {
        var onStub = sinon.stub();
        var oldFork = util.__get__('fork');
        var forkSpy = null;

        beforeEach(function() {
            util.__set__('fork', sinon.stub().returns({
                on: onStub
            }));
            forkSpy = util.__get__('fork');
        });

        afterEach(function() {
            util.__set__('fork', oldFork);
            onStub.reset();
        });

        it('should throw an error when not passed a `host` parameter', function() {
            expect(util.wakeDevBox).to.throw(Error);
        });

        describe('default behaviour', function() {
            var callbackStub = sinon.spy();

            beforeEach(function() {
                util.wakeDevBox('someDevLocation', callbackStub);
            });

            afterEach(function() {
                callbackStub.reset();
            });

            it('should fork the process', function() {
                expect(forkSpy.called).to.be.true();
            });

            it('should pass in the location of the start-script', function() {
                expect(forkSpy.getCall(0).args[0]).to.contain('/server-start');
            });

            it('should pass `null` as the 2nd parameter', function() {
                expect(forkSpy.getCall(0).args[1]).to.be.a('null');
            });

            it('should pass an object as the last parameter', function() {
                expect(forkSpy.getCall(0).args[2]).to.be.a('object');
            });

            it('should invoke the callback for every message receieved', function() {
                expect(onStub.getCall(0).args[0]).to.equal('message');
                expect(onStub.getCall(0).args[1]).to.equal(callbackStub);
            });
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
            expect(promptMock.start.called).to.be.true();
        });
    });
});