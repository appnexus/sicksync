## 2.1.0
- New `doctor` command to quickly troubleshoot why sicksync isn't working. See README.md for more.
- Updating package deps.

## 2.0.0
*Overview*

sicksync 2.0.0 Introduces a lot of new features and functionality. These changes are detailed further below, but to summarize:
- Multi-project syncing! You can now add projects to sicksync and easily sync multiple projects in one command.
- Better project management. sicksync now has commands to get project info, add projects, and remove them.
- Updating is now a lot easier as sicksync will let you know when there's updates, and takes care of updating your remote machines.
- Stateless remote code. This means that you'll never have to sync up your config files again.
- Git-style sub commands. No more nasty option hashes and a more extendable CLI.
- A complete rewrite top-to-bottom in ES6. Much easier to read and contribute to.
- Smaller/slimmer npm package output.

### New
- `sicksync start <projects...>`: Runs the sicksync process for the given space-separated `<projects...>`.
- `sicksync add-project | add`: Runs the setup wizard for a new project.
- `sicksync remove-project | rm <projects...>`: Removes project(s) from sicksync.
- `sicksync info [projects...]`: Prints out info for your given project(s).
- `sicksync update`: Update sicksync both locally and remotely for all projects.

### Breaking
- `sicksync --once` is now `sicksync once <projects...>`, and requires you to pass projects.
- `sicksync --config` is now `sicksync config`.
- `sicksync-local` is now covered by the `sicksync start <projects...>` command.
- `sicksync-remote` is now `sicksync remote`. `sicksync start <projects...>` does this for you automatically, so this effectively _should_ be ignored.
- Configs have undergone changes in both structure and shape. See below on migrating from sicksync 1.x.

### Deprecated
- `sicksync --debug`: use `sicksync config` to enable debug messages.
- `sicksync --encrypt`: use `sicksync config` to enable encryption.
- `sicksync --setup`: use `sicksync add-project`.

## 1.2.0
- *BREAKING* `big-sync` will now DELETE files in the remote location that aren't found in the local location. Please be ensure that, after upgrading, caution is ran when running either `sicksync` or `sicksync -o`.
- *MINOR* `big-sync` will now print it's progress when the `debug` flag is true in `sicksync` config.

## 1.1.18
- New config parameter: `followSymLinks`. When true, will follow and sync files/folders that are symlinked. Defaults to false

## 1.1.16
- Fixes an issue where sicksync may try to awaken the remote devbox twice, resuling in an EADDINUSE error.

## 1.1.15
- Removes the segfault handler as it's causing some linux distros to freak out. Go figure.
- Updates `chokidar` and `chai` dependencies.

## 1.1.14
- Runs a one-time-sync on start, and when `retryOnDisconnect` is true it'll run it before attempting to reconnect to the remote machine.

## 1.1.12
- New config flag `retryOnDisconnect` for when your remote machine closes.

## 1.1.11
- Makes segfault handling depend on debug mode

## 1.1.10
- Adds segfault handling

## 1.1.7
- Moved to the Official AppNexus Repo for better visibility.

## 1.1.0
- **Command-line API change**: Use `-c` or `--config` to open the `config` file. Use `-o` or `--Once` to do a one-time sync.
- Added support for globbing patterns
- New dependcy on `minimatch`

## 1.0.1
- Removing Browser-Sync as it's likely a cause of memory-leaks.
- Unit-tests for /lib modules, as well as 100% test-coverage.
- Bugfixes.

## 1.0.0
- Initial Release
