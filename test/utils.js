var _ = require('lodash');

module.exports = {
    resetSpies: function(spyObject, method) {
        method = method || 'reset';
        _.forIn(spyObject, _.method(method));
    }
};
