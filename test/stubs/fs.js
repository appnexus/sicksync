var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    readFileSync: sinon.stub().returnsArg(0),
    outputFile: sinon.spy(),
    mkdirs: sinon.spy(),
    delete: sinon.spy()
};

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

module.exports = api;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
