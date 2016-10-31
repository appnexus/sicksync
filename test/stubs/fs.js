import _ from 'lodash';
import sinon from 'sinon';

let existsSyncReturns = false;

const api = {
  readFileSync: sinon.stub().returnsArg(0),
  writeFileSync: sinon.spy(),
  outputFile: sinon.spy(),
  outputFileSync: sinon.spy(),
  mkdirs: sinon.spy(),
  remove: sinon.spy(),
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
