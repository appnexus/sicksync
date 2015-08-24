var _ = require('lodash'),
    sinon = require('sinon');

var mockConstructor = sinon.spy();

var api = {
    shell: sinon.stub().returnsThis(),
    flags: sinon.stub().returnsThis(),
    exclude: sinon.stub().returnsThis(),
    source: sinon.stub().returnsThis(),
    destination: sinon.stub().returnsThis(),
    output: sinon.stub().returnsThis(),
    set: sinon.stub().returnsThis(),
    progress: sinon.stub().returnsThis(),
    execute: sinon.stub().callsArg(0)
};

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

module.exports = mockConstructor;
module.exports._api = api;
module.exports.resetAll = resetAll;
