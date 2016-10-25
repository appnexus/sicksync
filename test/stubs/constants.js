var _ = require('lodash');

var originalProps = {
  SICKSYNC_DIR: '~/.sicksync',
  UPDATE_FILE: 'update.json',
  CONFIG_FILE: 'config.json',
};

var props = _.clone(originalProps);

function setProp(prop, newVal) {
  props[prop] = newVal;
}

function resetAll() {
  props = _.clone(originalProps);
}

module.exports = props;
module.exports.setProp = setProp;
module.exports.resetAll = resetAll;
module.exports['@noCallThru'] = true;
