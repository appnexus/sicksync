var fs = require('fs-extra'),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    untildify = require('untildify'),
    fsEvents = require('../../conf/events').FS.REMOTE;

function FSHelper() {}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.addFile = function(message) {
    fs.outputFile(untildify(message.filename), message.contents, function(err) {
        if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);
        this.emit(fsEvents.ADD_FILE, message.relativePath);
    }.bind(this));
};

FSHelper.prototype.addDir = function(message) {
    fs.mkdirs(untildify(message.filename), function(err) {
        if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);
        this.emit(fsEvents.ADD_DIR, message.relativePath);
    }.bind(this));
};

FSHelper.prototype.removePath = function(message) {
    fs.delete(untildify(message.filename), function(err) {
        if (err) return this.emit(fsEvents.DELETE_ERROR, err);
        this.emit(fsEvents.DELETE, message.relativePath);
    }.bind(this));
};

module.exports = FSHelper;
