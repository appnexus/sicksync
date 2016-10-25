import sinon from 'sinon';

const api = sinon.spy();

function resetAll() {
  api.reset();
}

module.exports = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
