var mockPackage = {};
var packageVersion = 1;

// Hack Alert:
// Since we have to change this value for tests, and it's static,
// wrap it in a getter so we can manipulate what it yields.
Object.defineProperty(mockPackage, 'version', {
    configurable: false,
    enumerable: true,
    writeable: false,
    get: function() {
        return packageVersion;
    }
});

function setVersion(value) {
    packageVersion = value;
}

module.exports = mockPackage;
module.exports.setVersion = setVersion;
