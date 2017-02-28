import { ary, partial } from 'lodash';
import { once } from '../local';

function sicksyncOnceCommand(program, config) {
  program
    .command('once [projects...]')
    .description('Runs a one-time sync on the supplied project(s)')
    .option('-n, --dry-run', 'Shows information on what files will be sent without sending them')
    .option('-D, --no-delete', 'Do not delete remote files on inital rsync')
    .action(partial(ary(once, 3), config));
}

export default sicksyncOnceCommand;
