var _ = require('lodash'),
  sinon = require('sinon');

var api = {
  on: sinon.spy(),
};

var mockConstructor = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

_.forIn(api, function(method, name) {
  mockConstructor[name] = method;
});

function triggerFsEvent() {
  api.on.lastCall.args[1].apply(null, arguments);
}

module.exports.watch = mockConstructor;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports.triggerFsEvent = triggerFsEvent;
module.exports['@noCallThru'] = true;
