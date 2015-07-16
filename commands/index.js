var normalizedPath = require('path').join(__dirname);

module.exports = function(program) {
    require('fs').readdirSync(normalizedPath).forEach(function(file) {
        if (file !== 'index.js') require('./' + file)(program);
    });
};
