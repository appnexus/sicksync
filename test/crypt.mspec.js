var expect = require('chai').expect,
    Crypt = require('../src/crypt'),
    crypt = new Crypt('somesecret');

describe('crypt', function() {
    describe('#encrypt', function() {
        it('should encrypt and return a string', function() {
            var message = 'wat';
            expect(message).to.not.equal(crypt.encrypt(message));
        });
    });

    describe('#decrypt', function() {
        it('should be able to decrypt a message back to the original value', function() {
            var message = 'wat';
            var encrypted = crypt.encrypt(message);
            expect(message).to.equal(crypt.decrypt(encrypted));
        });
    });

    describe('#stringifyAndEncrypt', function() {
        var testObject = {
            message: 'wat',
            type: 'message'
        };

        it('should serialize and encrypt an object', function() {
            expect(crypt.stringifyAndEncrypt(testObject, true)).to.be.a('string');
        });

        it('should throw an error when trying to JSON.parse this value', function() {
            var encryptedObject = crypt.stringifyAndEncrypt(testObject, true);

            expect(function() {
                JSON.parse(encryptedObject);
            }).to.throw;
        });

        it('should not throw an error when trying to JSON.parse and `prefersEncrypted` is false', function() {
            var encryptedObject = crypt.stringifyAndEncrypt(testObject, false);

            expect(function() {
                JSON.parse(encryptedObject);
            }).to.not.throw;

            expect(JSON.parse(encryptedObject)).to.be.an('object');
        });
    });

    describe('#decryptAndParse', function() {
        it('should simply JSON.parse the message passed to it', function() {
            expect(crypt.decryptAndParse('{}')).to.be.an('object');
        });

        it('should throw an error if passed a non-stringified object', function() {
            expect(function() {
                crypt.decryptAndParse('not an object');
            }).to.throw;
        });

        describe('when `withEncryption` is true', function() {
            var testObject = {
                message: 'secret!',
                type: 'message'
            };

            it('should return the original object that was encrpyted', function() {
                var encryptedObject = crypt.encrypt(JSON.stringify(testObject));

                expect(testObject).to.deep.equal(crypt.decryptAndParse(encryptedObject, true));
            });

            it('should throw an error if the message isn\'t serialized JSON', function() {
                var encryptedMessage = 123;

                expect(function() {
                    crypt.decryptAndParse(encryptedMessage);
                }).to.throw;
            });
        });
    });
});