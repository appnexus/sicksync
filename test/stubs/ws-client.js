import _ from 'lodash';
import sinon from 'sinon';

const api = {
  on: sinon.spy(),
  _connect: sinon.spy(),
  _handleDisconnect: sinon.spy(),
  _reconnect: sinon.spy(),
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

function triggerEvent(event) {
  const args = _.drop(arguments);
  const eventCall = getEventCall(event);

  eventCall.args[1].apply(null, args);
}

module.exports = mockConstructor;
module.exports.triggerEvent = triggerEvent;
module.exports.getEventCall = getEventCall;
module.exports.resetAll = resetAll;
module.exports._api = api;
module.exports['@noCallThru'] = true;
