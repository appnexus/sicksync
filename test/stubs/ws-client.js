var _ = require('lodash'),
    sinon = require('sinon');

var api = {
    on: sinon.spy(),
    _connect: sinon.spy(),
    _handleDisconnect: sinon.spy(),
    _reconnect: sinon.spy(),
    send: sinon.spy()
};

var mockConstructor = sinon.stub().returns(api);

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

function triggerEvent(event) {
    var args = _.drop(arguments);
    var eventCall = getEventCall(event);
    
    eventCall.args[1].apply(null, args);
}

module.exports = mockConstructor;
module.exports.triggerEvent = triggerEvent;
module.exports.getEventCall = getEventCall;
module.exports.resetAll = resetAll;
module.exports._api = api;
module.exports['@noCallThru'] = true;
