var fs = require('fs-extra'),
    util = require('../util'),
    server = null;

module.exports = {
    addFile: function(message) {
        fs.outputFile(message.filepath, message.contents);
    },
    addDir: function(message) {
        fs.mkdirs(message.filepath);
    },
    removePath: function(message) {
        fs.delete(message.filepath);
    }
};
