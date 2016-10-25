#!/usr/bin/env node

var version = global.process.version
    .split('v')[1]
    .split('.');

if (version[0] < 4) {
    console.log('======================================================');
    console.log('|   sicksync requires at least Node version 4.x.x   |');
    console.log('======================================================');
    process.exit(1);
}
