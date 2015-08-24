var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    on: sinon.spy(),
    watch: sinon.spy(),
    pauseWatch: sinon.spy()
};

var mockConstructor = sinon.stub().returns(api);

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

function triggerFsCall(callName, data) {
    _.each(api.on.getCalls(), function(call) {
        if (call.args[0] === callName) {
            call.args[1](data);
        }
    });
}

module.exports = mockConstructor;
module.exports.triggerFsCall = triggerFsCall;
module.exports.resetAll = resetAll;
module.exports._api = api;
module.exports['@noCallThru'] = true;
