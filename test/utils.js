module.exports = {
    resetSpies: function(spyObject) {
        Object.keys(spyObject).forEach(function(prop) {
            spyObject[prop].reset();
        });
    }
};