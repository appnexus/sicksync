var _ = require('lodash'),
  sinon = require('sinon');

var api = {
  start: sinon.spy(),
  on: sinon.spy(),
};

var constructorMock = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

module.exports = constructorMock;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
