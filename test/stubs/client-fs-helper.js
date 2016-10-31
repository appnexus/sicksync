import _ from 'lodash';
import sinon from 'sinon';

const api = {
  on: sinon.spy(),
  watch: sinon.spy(),
  pauseWatch: sinon.spy(),
};

const mockConstructor = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

function triggerFsCall(callName, data) {
  _.each(api.on.getCalls(), function(call) {
    if (call.args[0] === callName) {
      call.args[1](data);
    }
  });
}

module.exports = mockConstructor;
module.exports.triggerFsCall = triggerFsCall;
module.exports.resetAll = resetAll;
module.exports._api = api;
module.exports['@noCallThru'] = true;
