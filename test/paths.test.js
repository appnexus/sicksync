var test = require('tape');
var paths = require('../lib/paths');

test('Paths', function(t) {
	t.plan(3);

	t.equal(typeof paths, 'object', '`paths` should be an object');

	t.equal(typeof paths.getHome, 'function', '`#getHome` should be a function');

	t.equal(typeof paths.getHome(), 'string', '`#gethome` should return a string');
});