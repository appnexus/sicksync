import crypto from 'crypto';
import { CRYPT_ALGO as algo } from '../conf/constants';

function CryptHelper(secret) {
    return {
        _cryptHelper (text, isEncrypt) {
            let cryptMethod = isEncrypt ? 'createCipher' : 'createDecipher';
            let finalParam = isEncrypt ? 'hex' : 'utf8';
            let cipherArgs = isEncrypt ? [text, 'utf8', 'hex'] : [text, 'hex', 'utf8'];

            let cipher = crypto[cryptMethod](algo, secret);
            let result = cipher.update.apply(cipher, cipherArgs);
            result += cipher.final(finalParam);

            return result;
        },
        encrypt (text) {
            return this._cryptHelper(text, true);
        },
        decrypt (text) {
            return this._cryptHelper(text, false);
        },
        stringifyAndEncrypt (data, withEncryption) {
            let stringifiedData = JSON.stringify(data);

            if (withEncryption) {
                return this.encrypt(stringifiedData);
            } else {
                return stringifiedData;
            }
        },
        decryptAndParse (msg, withEncryption) {
            if (withEncryption) {
                msg = this.decrypt(msg);
            }
            return JSON.parse(msg);
        }
    };
}

export default CryptHelper;
