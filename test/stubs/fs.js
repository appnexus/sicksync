var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    readFileSync: sinon.stub().returnsArg(0)
}

function resetAll() {
    _.forIn(api, function(method) {
        method.reset();
    })
}

module.exports = api;
module.exports.resetAll = resetAll;
