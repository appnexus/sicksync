import { ary, partial } from 'lodash';
import { start } from '../local';

function sicksyncStartCommand(program, config) {
  program
        .command('start [projects...]')
        .description('Starts the continuous sicksync process for the given project(s)')
        .action(partial(ary(start, 2), config));
}

export default sicksyncStartCommand;
