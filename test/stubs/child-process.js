import _ from 'lodash';
import sinon from 'sinon';

const api = {
  exec: sinon.spy(),
  spawn: sinon.spy(),
};

function resetAll() {
  _.forIn(api, function(method) {
    if (_.isFunction(method.reset)) method.reset();
  });
}

module.exports = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
