var sinon = require('sinon'),
    oldInfo = console.info;

function resetAll() {
    console.info.reset();
}

function inject() {
    console.info = sinon.spy();
}

function restore() {
    console.info = oldInfo;
}

module.exports.inject = inject;
module.exports.restore = restore;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
