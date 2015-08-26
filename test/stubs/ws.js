var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    on: sinon.spy(),
    send: sinon.spy()
};

function resetAll() {
    _.forIn(api, function(method) {
        if (_.isFunction(method.reset)) method.reset();
    });
}

function getEventCall(event) {
    var callArgs = null;

    _.forIn(api.on.getCalls(), function(call) {
        if (call.args[0] === event) {
            callArgs = call;
        }
    });

    return callArgs;
}

function triggerEventWithArgs(event) {
    var args = _.drop(arguments);
    var eventCall = getEventCall(event);

    eventCall.args[1].appy(null, args);
}

var mockConstructor = sinon.stub().returns(api);

module.exports = mockConstructor;
module.exports.Server = mockConstructor;
module.exports._api = api;
module.exports.resetAll = resetAll;
module.exports.getEventCall = getEventCall;
module.exports.triggerEventWithArgs = triggerEventWithArgs;
module.exports['@noCallThru'] = true;
