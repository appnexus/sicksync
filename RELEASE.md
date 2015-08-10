## 2.0.0-rc
*BREAKING CHANGES*
- New git-style sub commands: Almost all sicksync commands have been broken out into sub-commands to make management easier and provide a better end-user experience:

    ### New commands
    - `sicksync update`: Update sicksync both locally and remotely.
    - `sicksync start`: Runs the sicksync process, same as just running `sicksync`.

    ### Updated commands
    - `sicksync --once` is now `sicksync once`
    - `sicksync --config` is now `sicksync config`
    - `sicksync --setup` is now `sicksync setup`
    - `sicksync-local` is now covered by `sicksync`.
    - `sicksync-remote` is now `sicksync remote`. `sicksync` does this for you.

    ### Deprecated comands
    - `sicksync --debug`: use `sicksync config` to enable debug messages.
    - `sicksync --encrypt`: use `sicksync config` to enable encryption.

- Config: Sicksync now has it's own directory in the users' `$HOME` path. Since the config file has moved feel free to generate a new one with `sicksync setup`, or move your config file: `mv ~/.sicksync-config.json ~/.sicksync/config.json`.

- Stateless Remotes: No more copying configs over to remote machines as remote boxes are now 100% stateless. Running `sicksync start` locally will spawn a the remote process with the necessary parameters.

*NEW FEATURES*
- Updating: Sicksync will now check once-a-day if there is any new updates, and will non-intrusively inform the user that an update is available. `sicksync update` will take care of updating locally as well as remotely. This runs `npm i -g sicksync` under-the-hood, so care should be taken if `sudo` is required as it's not supported by sicksync.

- Rewrite: While not outward-facing, the rewrite of sicksync has made it much easier to update and test, meaning more features and contributions in the long-term.

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
