import _ from 'lodash';
import { start } from '../local';

function sicksyncStartCommand(program, config) {
  program
    .command('start [projects...]')
    .description('Starts the continuous sicksync process for the given project(s)')
    .option('-D, --no-delete', 'Do not delete remote files on inital rsync')
    .action((projects, options) =>
      start(_.extend(config, _.pick(options, ['delete'])), projects))
}

export default sicksyncStartCommand;
