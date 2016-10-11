#!/usr/bin/env node

try {
  require('../dist/index')();
} catch (err) {
  require('babel/register');
  require('../src/index')();
}
