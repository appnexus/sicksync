var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    on: sinon.spy()
};

var mockConstructor = sinon.stub().returns(api);

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

_.forIn(api, function(method, name) {
    mockConstructor[name] = method;
});

module.exports = mockConstructor;
module.exports.resetAll = resetAll;
