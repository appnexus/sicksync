var _ = require('lodash'),
    _process = global.process,
    sinon = require('sinon');

var api = {
    exit: sinon.spy()
};

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

function inject() {
    process.exit = api.exit;
}

function restore() {
    process.exit = _process.exit;
    resetAll();
}

module.exports = api;
module.exports.inject = inject;
module.exports.restore = restore;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
