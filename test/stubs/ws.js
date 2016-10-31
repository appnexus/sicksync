import _ from 'lodash';
import sinon from 'sinon';

const api = {
  on: sinon.spy(),
  send: sinon.spy(),
};

const mockConstructor = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

function getEventCall(event) {
  let callArgs = null;

  _.forIn(api.on.getCalls(), function(call) {
    if (call.args[0] === event) {
      callArgs = call;
    }
  });

  return callArgs;
}

function triggerEventWithArgs(event) {
  const args = _.drop(arguments);
  const eventCall = getEventCall(event);

  eventCall.args[1].appy(null, args);
}

module.exports = mockConstructor;
module.exports.Server = mockConstructor;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports.getEventCall = getEventCall;
module.exports.triggerEventWithArgs = triggerEventWithArgs;
module.exports['@noCallThru'] = true;
