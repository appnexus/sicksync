#!/usr/bin/env node

var version = global.process.version
    .split('v')[1]
    .split('.');

if (version[1] < 12 && version[0] < 1) {
    console.log('======================================================');
    console.log('|   sicksync requires at least Node version 0.12.x   |');
    console.log('======================================================');
    process.exit(1);
}
