import _ from 'lodash';
import { start } from '../local';

function sicksyncStartCommand(program, config) {
  program
    .command('start [projects...]')
    .description('Starts the continuous sicksync process for the given project(s)')
    .option('-D, --disable-deletion', 'Do not delete files on the server')
    .option('-R, --disable-rsync', 'Do not do rsync on bigger file changes')
    .action((projects, options) =>
      start(_.extend(config, _.pick(options, ['disableDeletion', 'disableRsync'])), projects));
}

export default sicksyncStartCommand;
