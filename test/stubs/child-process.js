var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    exec: sinon.spy()
};

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

module.exports = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
