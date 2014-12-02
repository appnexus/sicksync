var expect = require('chai').expect,
    rewire = require('rewire'),
    crypt = rewire('../lib/crypt');

// Mocking Config
crypt.__set__('secret', 'some-secret');
crypt.__set__('config', {
    prefersEncrypted: false
});

describe('crypt', function() {
    it('should be an object', function() {
        expect(crypt).to.be.an('object');
    });

    ['encrypt', 'decrypt', 'stringifyAndEncrypt', 'decrypt'].forEach(function(method) {
        it('should have a #' + method + ' property', function() {
            expect(crypt[method]).to.be.a('function');
        });
    });

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

        beforeEach(function() {
            crypt.__set__('config', { prefersEncrypted: true });
        });

        it('should serialize and encrypt an object', function() {
            expect(crypt.stringifyAndEncrypt(testObject)).to.be.a('string');
        });

        it('should throw an error when trying to JSON.parse this value', function() {
            var encryptedObject = crypt.stringifyAndEncrypt(testObject);

            expect(function() {
                JSON.parse(encryptedObject);
            }).to.throw;
        });

        it('should not throw an error when trying to JSON.parse and `prefersEncrypted` is false', function() {
            crypt.__set__('config', { prefersEncrypted: false });

            var encryptedObject = crypt.stringifyAndEncrypt(testObject);

            expect(function() {
                JSON.parse(encryptedObject);
            }).to.not.throw;

            expect(JSON.parse(encryptedObject)).to.be.an('object');
        });
    });

    describe('#decryptAndParse', function() {
        describe('when `prefersEncrypted` is false', function() {
            beforeEach(function() {
                crypt.__set__('config', { prefersEncrypted: false });
            });

            it('should simply JSON.parse the message passed to it', function() {
                expect(crypt.decryptAndParse('{}')).to.be.an('object');
            });

            it('should throw an error if passed a non-stringified object', function() {
                expect(function() {
                    crypt.decryptAndParse('not an object');
                }).to.throw;
            });
        });

        describe('when `prefersEncrypted` is true', function() {
            var testObject = {
                message: 'secret!',
                type: 'message'
            };

            beforeEach(function() {
                crypt.__set__('config', { prefersEncrypted: true });
            });

            it('should return the original object that was encrpyted', function() {
                var encryptedObject = crypt.encrypt(JSON.stringify(testObject));

                expect(testObject).to.deep.equal(crypt.decryptAndParse(encryptedObject));
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