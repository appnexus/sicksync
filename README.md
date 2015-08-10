![sicksync](https://raw.githubusercontent.com/appnexus/sicksync/master/img/sicksync.png)
`npm install -g sicksync`

[![npm version](https://badge.fury.io/js/sicksync.svg)](http://badge.fury.io/js/sicksync)
[![Build Status](https://travis-ci.org/appnexus/sicksync.svg?branch=master)](https://travis-ci.org/appnexus/sicksync)
[![Code Climate](https://codeclimate.com/github/appnexus/sicksync/badges/gpa.svg)](https://codeclimate.com/github/appnexus/sicksync)
[![Build Dependencies](https://david-dm.org/appnexus/sicksync.png)](https://david-dm.org/appnexus/sicksync)

Has scp got you down? rsync just not fast enough? Well, we hear your pain, and that's why there's sicksync.

sicksync is a CLI to sync your projects code to a remote machine. If you work in an environment where you edit files locally, then push them to a development machine, then sicksync is the tool for you.

## Requirements

- NodeJS with npm
- You can just `ssh to-your-remote-machine` without using a password (ie, ssh keys)

## Install
sicksync needs to be installed globally on both your remote and local machines.

- Local: `npm install -g sicksync`
- Remote: `ssh to-your-remote-machine` then `npm install -g sicksync`
- Local: `sicksync` will start the syncing process

## Overview
sicksync, at it's core, is a simple websocket service that sends small file changes to a remote machine. If it get's hammered with changes (ie, a `git checkout some-massive-branch`), it will defer to rsync to transfer these large deltas. This makes it a stupendous tool when you need a short feedback-loop, but still need the flexibility to send large files. It also includes an encryption layer if you're worried about sending files plain-text.

## Command Line Options

`sicksync -h, --help`

Outputs the help information as well as the version number.

`sicksync` | `sicksync start`

Runs the continuous syncing process, taking care of both the remote and local machines (process management wise). Small, iterative changes use a blazing-fast WebSocket connection to send file information, while larger changes trigger a rsync update. This ensures both speed in rapid changes and confidence in larger ones.

`sicksync setup`

Runs the setup wizard, which will create a `.sicksync/config.json` in your home directory.

This file is a simple JSON config object, so feel free to change it whenever.

`sicksync once [-n | --dry-run]`

Runs a one-time sync, which is simply `rsync` under-the-hood. This happens automatically everytime you run `sicksync start`, and if you have the `retryOnDisconnect` flag will run on reconnect.

`sicksync remote [--port | -p <port>] [--secret | -s <secret>] [--encryption | -e] [--debug | -d]`

Starts the remote process for continous syncing. This likely does not need to be called directly since `sicksync start` takes care of that for you. Since the remote end of sicksync is "dumb", you'll have to manually supply the port number and secret key.

`sicksync config`

Opens the sicksync config file in the editor of your choice.

## Configuration Options

`sourceLocation: {absolute filepath}`

The *absolute* file-path you want to watch and sync with. Cannot have any `~` as sicksync doesn't yet understand the home shorthand. sicksync will also watch any nested file-changes (recursively) and update the remote machine with changes.

`excludes: {array of relative filepaths or globs}`

An array of file(s) or filepath(s) that, when matched, sicksync will ignore and not send changes. Editor configuration and `.git/*` files are generally ok to ignore. Uses [`minimatch`](https://github.com/isaacs/minimatch) for globbing.

`websocketPort: {number}`

The port number which you want BOTH the local and remote machines to use for websocket-syncing.

`secret: {string}`

The secret used for encrpyted messages as well as the initial handshake for the websocket syncs. If there is a mis-match between the local and remote machine's secret, sicksync will not work. This get's automatically generated in the wizard, so it's not necessary to change it unless some bad happens.

`userName: {string}`

The username you use to log into the remote machine with. sicksync will use this to start the syncing process, as well as copy files over.

`hostname: {string}`

The hostname or ip address of the remote machine you wish to sync with.

`destinationLocation: {filepath}`

The location on your remote machine you wish to apply changes to. Again, this must be the *absolute* path in your local machine.

`prefersEncrypted: {boolean}`

Flag that will turn on or off encrypted sync messages.

`debug: {boolean}`

Flag that will turn on or off debug messages during the syncing process.

`retryOnDisconnect: {boolean}`

When true, this will tell `sicksync` to re-attempt to connect when the server disconnects. Using `CTRL+C` will not trigger a retry locally. Also runs a one-time sync beforehand to ensure any lost changes find their way home.

`followSymLinks: {boolean}`

When true, this will tell `sicksync` to follow and sync files and folders that are symlinked. Defaults to `false` in setup.

## Migrating to from 1.x to 2.x

2.x introduces a number of new and breaking changes. It's worthwhile to upgrade, as sicksync now has better reliabitiliy and extensibility in 2.x.

1. Move your config file: `mv ~/.sicksync-config.json ~/.sicksync/config.json`. There are no breaking config changes.
2. Update sicksync locally: `npm i -g sicksync`.
3. Update sicksync remotely: `ssh username@devbox "npm i -g sicksync"`.
4. Remove the config file from your remote maching: `rm ~/.sicksync-config.json`

After this, you'll see when updates are available when running sicksync, and can easily update by running `sicksync update`.

## Troubleshooting

Q: I'm seeing `[ERR] command not found: sicksync remote` when starting sicksync locally, what gives?

A: This likely has to do with `sicksync remote` not being in your `$PATH` when `sicksync` ssh's into your remote machine to start the process. If you are using ZSH, try moving your $PATH definitions to `.zshenv`.

Q: I'm seeing `Error: Module did not self-register.` when running sicksync.

A: If you've recently updated `node` or changed versions, you'll need to recompile the binaries that go along with `sicksync`. Run `npm install -g sicksync` again, or if you've forked/cloned the repo then remove the associated `node_modules` folder and run `npm install`.

Q: `sicksync once` is taking a long time to run, is that ok?

A: Depends. If there are a lot of changes, the one-time-sync can take a bit to run. Can `scp` or `rsync` be ran effectively?

Q: I'm having an issue, and I need help.

A: Send a PR with the problem and we'll give it a gander!
