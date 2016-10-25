import _ from 'lodash';
import sinon from 'sinon';

const api = {
  start: sinon.spy(),
  on: sinon.spy(),
};

const constructorMock = sinon.stub().returns(api);

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

module.exports = constructorMock;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
