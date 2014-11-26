/**
 *  Crypt Lib
 *
 *  Simple crypt wrapper for
 *  encryption/decryption
 */
var crypto = require('crypto'),
    util = require('./util'),
    algorithm = 'aes-128-ctr',
    config = util.getConfig(),
    secret = config.secret;

module.exports = {
    encrypt: function(text) {
        var cipher = crypto.createCipher(algorithm, secret);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    decrypt: function(text) {
        var decipher = crypto.createDecipher(algorithm, secret);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },
    stringifyAndEncrypt: function(data) {
        var stringifiedData = JSON.stringify(data);

        if (config.prefersEncrypted) {
            return this.encrypt(stringifiedData);
        } else {
            return stringifiedData;
        }
    },
    decryptAndParse: function(msg) {
        if (config.prefersEncrypted) {
            msg = this.decrypt(msg);
        }
        try {
            return JSON.parse(msg);
        } catch (e) {
            throw new Error('Couldn\t parse: ' + msg + '\n' + e);
        }
    }
};