var _ = require('lodash'),
  sinon = require('sinon');

var existsSyncReturns = false;

var api = {
  readFileSync: sinon.stub().returnsArg(0),
  writeFileSync: sinon.spy(),
  outputFile: sinon.spy(),
  outputFileSync: sinon.spy(),
  mkdirs: sinon.spy(),
  delete: sinon.spy(),
  existsSync: sinon.stub().returns(existsSyncReturns),
};

function resetAll() {
  existsSyncReturns = false;
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

function setExistsSyncFlag(value) {
  existsSyncReturns = value;
}

module.exports = api;
module.exports.resetAll = resetAll;
module.exports.setExistsSyncFlag = setExistsSyncFlag;
module.exports['@noCallThru'] = true;
