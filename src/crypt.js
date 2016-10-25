import crypto from 'crypto';
import { CRYPT_ALGO as algo } from '../conf/constants';

export class CryptHelper {
  constructor(secret) {
    this.secret = secret;
  }

  _cryptHelper(text, isEncrypt) {
    const cryptMethod = isEncrypt ? 'createCipher' : 'createDecipher';
    const finalParam = isEncrypt ? 'hex' : 'utf8';
    const cipherArgs = isEncrypt ? [text, 'utf8', 'hex'] : [text, 'hex', 'utf8'];

    const cipher = crypto[cryptMethod](algo, this.secret);
    let result = cipher.update.apply(cipher, cipherArgs);
    result += cipher.final(finalParam);

    return result;
  }

  encrypt(text) {
    return this._cryptHelper(text, true);
  }

  decrypt(text) {
    return this._cryptHelper(text, false);
  }

  stringifyAndEncrypt(data, withEncryption) {
    const stringifiedData = JSON.stringify(data);

    if (withEncryption) {
      return this.encrypt(stringifiedData);
    } else {
      return stringifiedData;
    }
  }

  decryptAndParse(msg, withEncryption) {
    if (withEncryption) {
      msg = this.decrypt(msg);
    }
    return JSON.parse(msg);
  }
}

export default CryptHelper;
