import _ from 'lodash';
import sinon from 'sinon';
import util from '../../src/util';

let _config = {};

const sshApi = {
  stdout: {
    on: sinon.spy(),
  },
  stdin: {
    write: sinon.spy(),
  },
  kill: sinon.spy(),
};

const prompterApi = {
  get: sinon.spy(),
};

const api = _.assign({}, util, {
  logSpy: sinon.spy(),
  getConfig: sinon.stub().returns(_config),
  shellIntoRemote: sinon.stub().returns(sshApi),
  setupPrompter: sinon.stub().returns(prompterApi),
  writeConfig: sinon.spy(),
  getUpdatePath: sinon.spy(),
  generateLog: sinon.stub().returns(function() {
    api.logSpy.apply(null, arguments);
  }),
});

function triggerStdout(message) {
  sshApi.stdout.on.lastCall.args[1](new Buffer(message));
}

function resetAll() {
  sshApi.stdout.on.reset();
  sshApi.stdin.write.reset();
  sshApi.kill.reset();
  prompterApi.get.reset();

  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

function setConfig(config) {
  _config = config;
}

module.exports = api;
module.exports._ssh = sshApi;
module.exports._prompt = prompterApi;
module.exports.triggerStdout = triggerStdout;
module.exports.setConfig = setConfig;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
