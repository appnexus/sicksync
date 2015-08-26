var _ = require('lodash'),
    sinon = require('sinon');

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

function inject() {
    sinon.spy(console, 'log');
}

function restore() {
    console.log.restore();
}

module.exports.inject = inject;
module.exports.restore = restore;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
