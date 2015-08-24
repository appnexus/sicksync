var properties = {
	SICKSYNC_DIR: '',
	UPDATE_FILE: '',
	CONFIG_FILE: ''
};

function setProp(prop, newVal) {
	properties[prop] = newVal;
}

module.exports = properties;
module.exports.setProp = setProp;
