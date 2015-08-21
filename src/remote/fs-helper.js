var fs = require('fs-extra'),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    untildify = require('untildify'),
    fsEvents = require('../../conf/events').FS.REMOTE;

function FSHelper() {}

nodeUtil.inherits(FSHelper, EventEmitter);

FSHelper.prototype.addFile = function(message) {
    fs.outputFile(untildify(message.destinationpath), message.contents, function(err) {
        if (err) return this.emit(fsEvents.ADD_FILE_ERROR, err);
        this.emit(fsEvents.ADD_FILE, message.destinationpath);
    }.bind(this));
};

FSHelper.prototype.addDir = function(message) {
    fs.mkdirs(untildify(message.destinationpath), function(err) {
        if (err) return this.emit(fsEvents.ADD_DIR_ERROR, err);
        this.emit(fsEvents.ADD_DIR, message.destinationpath);
    }.bind(this));
};

FSHelper.prototype.removePath = function(message) {
    fs.delete(untildify(message.destinationpath), function(err) {
        if (err) return this.emit(fsEvents.DELETE_ERROR, err);
        this.emit(fsEvents.DELETE, message.destinationpath);
    }.bind(this));
};

module.exports = FSHelper;
