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
