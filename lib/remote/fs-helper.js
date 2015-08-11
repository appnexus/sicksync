var fs = require('fs-extra');

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
