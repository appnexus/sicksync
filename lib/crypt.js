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
    _crypt: function(text, isEncrypt) {
        var cryptMethod = isEncrypt ? 'createCipher' : 'createDecipher';
        var finalParam = isEncrypt ? 'hex' : 'utf8';
        var cipherArgs = isEncrypt ? [text, 'utf8', 'hex'] : [text, 'hex', 'utf8'];

        var cipher = crypto[cryptMethod](algorithm, secret);
        var result = cipher.update.apply(cipher, cipherArgs);
        result += cipher.final(finalParam);

        return result;
    },
    encrypt: function(text) {
        return this._crypt(text, true);
    },
    decrypt: function(text) {
        return this._crypt(text, false);
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
        return JSON.parse(msg);
    }
};