import _ from 'lodash';
import sinon from 'sinon';

const api = {
  addFile: sinon.spy(),
  addDir: sinon.spy(),
  removePath: sinon.spy(),
  on: sinon.spy(),
};

const mockConstructor = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

function triggerFSCall(callName, data) {
  _.each(api.on.getCalls(), function(call) {
    if (call.args[0] === callName) {
      call.args[1](data);
    }
  });
}

module.exports = mockConstructor;
module.exports.triggerFSCall = triggerFSCall;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
