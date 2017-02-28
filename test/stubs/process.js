import sinon from 'sinon';

function resetAll() {
  if (process.exit.reset) process.exit.reset();
}

function inject() {
  sinon.stub(process, 'exit');
}

function restore() {
  process.exit.restore();
  resetAll();
}

module.exports.inject = inject;
module.exports.restore = restore;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
