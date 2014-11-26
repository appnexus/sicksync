var test = require('tape');
var rewire = require('rewire');
var sinon = require('sinon');
var WSClient = rewire('../lib/ws-client');

// WebSocket Stubs
var wsSendStub = sinon.stub();
var wsOnStub = sinon.stub();
var WSStub = sinon.stub().returns({
	on: wsOnStub,
	send: wsSendStub
});

// FS Stubs
var pubkeyMock = 'pubkey';
var readFileSyncStub = sinon.stub().returns(pubkeyMock);
var fsStub = {
	readFileSync: readFileSyncStub
};

// Helpers
function clearWsStubs() {
	wsSendStub.reset();
	wsOnStub.reset();
	WSStub.reset();
}

function clearFsStubs() {
	readFileSyncStub.reset();
}

// Rewiring Dependencies
WSClient.__set__('fs', fsStub);
WSClient.__set__('WebSocket', WSStub);

test('WS Client', function(t) {

	t.test('WS Client Constructor', function(t) {
		t.equal(typeof WSClient, 'function', 'WSClient shoudl be a function constructor.');
		t.doesNotThrow(WSClient, 'It should not throw an error when not passing in parameters');
		t.doesNotThrow(function() { new WSClient({ url: '' }); }, 'It should not throw when not passing in a URL in params');
		t.equal(typeof new WSClient(), 'object', 'Should return an object');
		t.equal(typeof (new WSClient()).sendFile, 'function', 'Returned object should have a `sendFile` method');

		t.end();
	});

	t.test('WS Client WebSocket Interaction', function(t) {
		var wsClient = null;
		var hostUrl = 'http://localhost:2001';
		var sendFileMock = {
			name: 'gulpfile',
			contents: 'wat',
			location: 'some/dir/somewhere'
		};

		clearWsStubs();
		wsClient = new WSClient({ url: hostUrl });

		t.equal(WSStub.getCall(0).args[0], hostUrl, 'Should construct a WS with ' + hostUrl);
		t.equal(wsOnStub.getCall(0).args[0], 'open', 'Should register an `on` handler');
		t.equal(typeof wsOnStub.getCall(0).args[1], 'function', 'Should register a `function` on the `on` handler');

		// Trigger `on` callback
		wsOnStub.getCall(0).args[1]();

		t.equal(typeof JSON.parse(wsSendStub.getCall(0).args[0]), 'object', 'Should send an object after `on` is triggered');
		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).subject, 'handshake', 'Should have a "handshake" subject');
		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).pubkey,  pubkeyMock, 'Should have send a ' + pubkeyMock + ' for `pubkey`');

		// Send file, clear stubs
		clearWsStubs();
		wsClient.sendFile(sendFileMock);

		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).subject, 'file-change', 'Should send a "file-change" subject');
		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).name, sendFileMock.name, 'Should send a "name" of ' + sendFileMock.name);
		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).contents, sendFileMock.contents, 'Should send a "contents" of ' + sendFileMock.contents);
		t.equal(JSON.parse(wsSendStub.getCall(0).args[0]).location, sendFileMock.location, 'Should send a "location" of ' + sendFileMock.location);

		t.end();
	});

	t.test('WS Client FileSystem Interaction', function(t) {
		var wsClient = null;

		// Clear stubs, trigger `on` callback
		clearFsStubs();
		clearWsStubs();
		wsClient = new WSClient();
		wsOnStub.getCall(0).args[1]();

		t.equal(typeof readFileSyncStub.getCall(0).args[0], 'string', 'Should pass a file path');
		t.ok(readFileSyncStub.getCall(0).args[0].indexOf('.ssh'), 'Should include .ssh in the file path');

		t.end();
	});
});