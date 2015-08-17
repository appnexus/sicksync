var fs = require('fs-extra'),
    nodeUtil = require('util'),
    untildify = require('untildify'),
    EventEmitter = require('events').EventEmitter,
    fsEvents = require('../../conf/events').FS.REMOTE;

function FSHelper() {}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.addFile = function(message) {
    fs.outputFile(untildify(message.filepath), message.contents, function(err) {
        if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);
        this.emit(fsEvents.ADD_FILE, message.filepath);
    }.bind(this));
};

FSHelper.prototype.addDir = function(message) {
    fs.mkdirs(untildify(message.filepath), function(err) {
        if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);
        this.emit(fsEvents.ADD_DIR, message.filepath);
    }.bind(this));
};

FSHelper.prototype.removePath = function(message) {
    fs.delete(untildify(message.filepath), function(err) {
        if (err) return this.emit(fsEvents.DELETE_ERROR, err);
        this.emit(fsEvents.DELETE, message.filepath);
    }.bind(this));
};

module.exports = FSHelper;
