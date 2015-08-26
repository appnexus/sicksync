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
- You can `npm install -g` without `sudo`
- You can just `ssh to-your-remote-machine` without using a password (ie, ssh keys)

## Install
Installing `sicksync` is easy, and can easily be added your existing machines after they've been added:

- Local: `npm install -g sicksync`
- Add your first project: `sicksync add`
- Have sicksync install itself on your remote machine: `sicksync update`

## Overview
sicksync, at it's core, is a simple websocket service that sends small file changes to a remote machine. If it get's hammered with changes (ie, a `git checkout some-massive-branch`), it will defer to rsync to transfer these large deltas. This makes it a stupendous tool when you need a short feedback-loop, but still need the flexibility to send large files. It also includes an encryption layer if you're worried about sending files plain-text.

## Command Line Options

`sicksync` || `sicksync -h, --help`

Outputs the help information and all the possible command line options. All sub-commands have their own help text, and can be run by passing an additional `-h` with them. Eg, `sicksync start -h`.

`sicksync add-project | add`

Runs the setup wizard for a new project, which will create a `.sicksync/config.json` in your home directory if not already present.

`sicksync start [projects...]`

Runs the continuous syncing process, taking care of both the remote and local machines (process management wise). Small, iterative changes use a blazing-fast WebSocket connection to send file information, while larger changes trigger a rsync update. This ensures both speed in rapid changes, and confidence in larger ones.

If `[projects...]` isn't passed in, sicksync will try and find the project based on your current working directory.

`sicksync once [-n | --dry-run] [projects...]`

Runs a one-time sync, which is simply `rsync` under-the-hood. This happens automatically everytime you run `sicksync start`, and if you have the `retryOnDisconnect` flag will run on reconnect.

If `[projects...]` isn't passed in, sicksync will try and find the project based on your current working directory.

`sicksync remove-project | rm <projects...>`

Removes the projects from sicksync's internal config. This is a destructive action and is not reversable.

`sicksync update [--check | -c] [--migrate-config | -m]`

Updates sicksync locally, as well as _all of your remote machines_. This _will_ run `npm i -g sicksync` internally, and does not do it as a `sudo`, so care should be taken if you haven't setup `npm` accordingly. [Please see this article for more information](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

The `--check` flag will see check what version of sicksync is available and print the version difference. 

The `--migrate-config` flag will migrate your config file to accomodate the current version of sicksync. See the "Migrating To..." below for more information on migrating.

`sicksync config`

Opens the sicksync config file in the editor of your choice.

`sicksync remote [--port | -p <port>] [--secret | -s <secret>] [--encryption | -e] [--debug | -d]`

Starts the remote process for continous syncing. This likely does not need to be called directly since `sicksync start` takes care of that for you. Since the remote end of sicksync is "dumb", you'll have to manually supply the port number and secret key.

## Configuration Options

sicksync will write to a central JSON file (located in `~/.sicksync/config.json`). This JSON blob is pretty self-documentating, but there are two critical pieces to it's hierarchy:

### Global Options

There are currently only two options you can configure globally, and are applied to _all_ projects in your configuration:

`debug: {boolean}`

Flag that will turn on or off debug messages during the syncing process.

`retryOnDisconnect: {boolean}`

When true, this will tell `sicksync` to re-attempt to connect when the server disconnects. Using `CTRL+C` will not trigger a retry locally. Also runs a one-time sync beforehand to ensure any lost changes find their way home.

### Project Options

Project Options apply only to each individual project, and can be changed at any time.

`project: {project-name}`

Generated automatically if when using `sicksync add-project`, but is the label used in debugging messages when syncing.

`sourceLocation: {filepath}`

The file-path you want to watch and sync with. sicksync will also watch any nested file-changes (recursively) and update the remote machine with changes.

`destinationLocation: {filepath}`

The location on your remote machine you wish to apply changes to.

`excludes: {array of relative filepaths or globs}`

An array of file(s) or filepath(s) that, when matched, sicksync will ignore and not send changes. Editor configuration and `.git/*` files are generally ok to ignore. Uses [`minimatch`](https://github.com/isaacs/minimatch) for globbing.

`websocketPort: {number}`

The port number which you want BOTH the local and remote machines to use for websocket-syncing.

`userName: {string}`

The username you use to log into the remote machine with. sicksync will use this to start the syncing process, as well as copy files over.

`hostname: {string}`

The hostname or ip address of the remote machine you wish to sync with.

`prefersEncrypted: {boolean}`

Flag that will turn on or off encrypted sync messages.

`followSymLinks: {boolean}`

When true, this will tell `sicksync` to follow and sync files and folders that are symlinked. Defaults to `false` in setup.

## Migrating to from 1.x to 2.x

2.x introduces a number of new and breaking changes. It's worthwhile to upgrade, as sicksync now has better reliabitiliy, new functionality, and extensibility in 2.x. Aside from command-line changes, sicksync 2.x also introduces a breaking config change as well. Below are the steps you'll need to run in order to migrate to sicksync 2.x:

1. Update sicksync locally: `npm i -g sicksync`.
2. Run the command `sicksync update --migrate-config`. This will automatically move your config file, and update it.
3. Run `sicksync update`. This will update your remote machine to the latest version of sicksync.
4. Remove the config file from your remote and local machines: `rm ~/.sicksync-config.json`

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
