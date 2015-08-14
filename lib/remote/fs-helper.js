var fs = require('fs-extra'),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter;

function FSHelper() {}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.addFile = function(message) {
    fs.outputFile(message.filepath, message.contents, function(err) {
        if (err) return this.emit('add-file-error', err);
        this.emit('add-file', message.filepath);
    }.bind(this));
};

FSHelper.prototype.addDir = function(message) {
    fs.mkdirs(message.filepath, function(err) {
        if (err) return this.emit('add-dir-error', err);
        this.emit('add-dir', message.filepath);
    }.bind(this));
};

FSHelper.prototype.removePath = function(message) {
    fs.delete(message.filepath, function(err) {
        if (err) return this.emit('delete-error', err);
        this.emit('delete', message.filepath);
    }.bind(this));
};

module.exports = FSHelper;
