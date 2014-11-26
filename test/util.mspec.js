var expect = require('chai').expect,
    rewire = require('rewire'),
    util = rewire('../lib/util');

describe('util', function() {
    it('should export an object', function() {
        expect(util).to.be.an.object;
    });

    describe('#getHome', function() {
        it('should return a string', function() {
            expect(util.getHome()).to.be.a('string');
        });

        it('should append a trailing slash', function() {
            var path = util.getHome();
            var lastChar = path.substring(path.length - 1);
            expect(lastChar).to.equal('/');
        });
    });

    describe('#getConfigPath', function() {
        it('should return a string', function() {
            expect(util.getConfigPath()).to.be.a('string');
        });

        it('should contain `json` in it\'s path', function() {
            expect(util.getConfigPath().indexOf('json') > -1).to.be.true();
        });
    });

    describe('#getConfig', function() {
        it('should return an object', function() {
            expect(util.getConfig()).to.be.an('object');
        });
    });

    describe('#isEmpty', function() {
        it('should return true if it\'s passed an empty object', function() {
            expect(util.isEmpty({})).to.be.true();
        });

        it('should return false if it\'s passed a non-empty object', function() {
            expect(util.isEmpty({'wat':'wat'})).to.be.false();
        });
    });
});