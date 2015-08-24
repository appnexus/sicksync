var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    log: sinon.spy()
}

function resetAll() {
    _.forIn(api, function(method) {
        method.reset();
    });
}

module.exports = api;
module.exports.resetAll = resetAll;