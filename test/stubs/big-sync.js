var sinon = require('sinon');

var constructorMock = sinon.spy();

function resetAll() {
  constructorMock.reset();
}

function triggerBigSyncComplete() {
  constructorMock.lastCall.args[2]();
}

module.exports = constructorMock;
module.exports.resetAll = resetAll;
module.exports.triggerBigSyncComplete = triggerBigSyncComplete;
module.exports['@noCallThru'] = true;
