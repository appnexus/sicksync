import { expect } from 'chai';
import proxyquire from 'proxyquire';

// Stubs
import fsStub from './stubs/fs';
import utilStub from './stubs/util';
import childStub from './stubs/child-process';
import latestVersionStub from './stubs/latest-version';
import packageStub from './stubs/package';
import consoleStub from './stubs/console';

// Inject
const update = proxyquire('../src/update', {
  'child_process': childStub,
  'latest-version': latestVersionStub,
  './util': utilStub,
  'fs-extra': fsStub,
  '../package.json': packageStub,
}).default;

const configV1 = {
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
    '**.swp',
  ],
  'prefersEncrypted': false,
  'websocketPort': '8675',
  'followSymLinks': false,
  'project': 'hbui-src',
};

describe('Update', function() {

  before(function() {
    consoleStub.inject();
  });

  after(function() {
    consoleStub.restore();
  });

  afterEach(function() {
    fsStub.resetAll();
    utilStub.resetAll();
    childStub.resetAll();
    latestVersionStub.resetAll();
    consoleStub.resetAll();
  });

  describe('#migrate1to2', function() {
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
        version: '3.4.5',
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

  describe('#notify', function() {
    describe('When there\'s a new package out', function() {
      beforeEach(function() {
        packageStub.setVersion(2);
      });

      it('should log a message that a new version is available', function() {
        update.notify();
        expect(console.info.lastCall.args[0]).to.contain('Sicksync update available!');
      });

      it('should log the version differences', function() {
        update.notify();
        expect(console.info.lastCall.args[2]).to.contain('Current version:');
        expect(console.info.lastCall.args[5]).to.contain('Latest version:');
      });
    });

    describe('When there is NOT a new package out', function() {
      beforeEach(function() {
        packageStub.setVersion(1);
      });

      it('should not print any information at all', function() {
        update.notify();
        expect(console.info.called).to.be.false;
      });
    });
  });

  describe('#update', function() {
    describe('Options', function() {
      describe('Checked', function() {
        it('should print version information when hearing back from latestVersion', function() {
          update.update(null, { check: true });
          latestVersionStub.lastCall.args[1](null, '1.2.3');

          expect(console.info.called).to.be.true;
        });

        it('should not print anything if the latestVersion call fails', function() {
          update.update(null, { check: true });
          latestVersionStub.lastCall.args[1]('ERROR!');

          expect(console.info.called).to.be.false;
        });
      });

      describe('migrateConfig', function() {
        it('should run the `migrateToConfig` functionality', function() {
          update.update(configV1, { migrateConfig: true });

          expect(utilStub.writeConfig.called).to.be.true;
        });
      });
    });


    describe('Default behavior', function() {
      const config = {
        projects: [{
          project: 'my-project',
          username: 'jgriffith',
          hostname: 'my-host',
        }, {
          project: 'another-project',
          username: 'tdale',
          hostname: 'wat',
        }],
      };

      it('should update sicksync locally', function() {
        update.update(config, {});

        expect(childStub.exec.lastCall.args[0]).to.equal('npm i -g sicksync');
      });

      it('should log into each remote machine and update sicksync', function() {
        update.update(config, {});

        expect(utilStub.shellIntoRemote.firstCall.args[0])
                    .to.equal(config.projects[0].username + '@' + config.projects[0].hostname);

        expect(utilStub.shellIntoRemote.secondCall.args[0])
                    .to.equal(config.projects[1].username + '@' + config.projects[1].hostname);
      });
    });
  });

  describe('#updateLocal', function() {
    beforeEach(function() {
      update.updateLocal();
    });

    it('should execute execute the update', function() {
      expect(childStub.exec.lastCall.args[0]).to.equal('npm i -g sicksync');
    });

    it('should log any issues if the update failed', function() {
      const errorMessage = 'ERROR!';
      childStub.exec.lastCall.args[1](errorMessage);

      expect(console.info.lastCall.args[1]).to.contain('Update failed! Please run manually');
      expect(console.info.lastCall.args[2]).to.contain(errorMessage);
    });

    it('should log any issues if the update failed via stderr', function() {
      const errorMessage = 'ERR!';
      childStub.exec.lastCall.args[1](null, null, errorMessage);

      expect(console.info.lastCall.args[1]).to.contain('Update failed! Please run manually');
      expect(console.info.lastCall.args[2]).to.contain(errorMessage);
    });

    it('should log when the operation is successful', function() {
      childStub.exec.lastCall.args[1](null, null, null);

      expect(console.info.lastCall.args[1]).to.contain('Updated Successfully!');
    });
  });

  describe('#updateRemote', function() {
    const projectDef = {
      username: 'joel',
      hostname: 'my-host',
    };

    it('should use the user name and hostname to shell into the remote box', function() {
      update.updateRemote(projectDef);

      expect(utilStub.shellIntoRemote.lastCall.args[0]).to.equal(projectDef.username + '@' + projectDef.hostname);
    });

    describe('once shelled in', function() {
      beforeEach(function() {
        update.updateRemote(projectDef);
      });

      it('should run the update command once shelled in', function() {
        utilStub.triggerStdout('Last Login');

        expect(utilStub._ssh.stdin.write.lastCall.args[0]).to.contain('npm i -g sicksync');
      });

      it('should log a message if sicksync once sicksync is installed', function() {
        utilStub.triggerStdout('sicksync@2.0.0');

        expect(console.info.lastCall.args[1]).to.contain('Updated Successfully!');
      });

      it('should log a message once sicksync is installed and exit', function() {
        utilStub.triggerStdout('sicksync@2.0.0');

        expect(console.info.lastCall.args[1]).to.contain('Updated Successfully!');
        expect(utilStub._ssh.kill.called).to.be.true;
      });

      it('should log a message if it errors and exit', function() {
        utilStub.triggerStdout('ERR! No sicksync!');

        expect(console.info.lastCall.args[1]).to.contain('Update failed! Please run manually');
        expect(utilStub._ssh.kill.called).to.be.true;
      });
    });
  });
});
