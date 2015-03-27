module.exports = {
    resetSpies: function(spyObject) {
        Object.keys(spyObject).forEach(function(prop) {
            spyObject[prop].reset();
        });
    },
    makeMockConfig: function(params) {
    	params = params || {};
    	return {
    		excludes: params.excludes || ['one', 'two', 'three'],
		    sourceLocation: params.sourceLocation || ['/some/file/path'],
		    hostname: params.hostname || 'myCoolHost',
		    destinationLocation: params.destinationLocation || ['/some/where/out/there']
    	};
    }
};