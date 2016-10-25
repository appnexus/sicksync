import { ary, partial } from 'lodash';
import { info } from '../project-helper';

function sicksyncInfoCommand(program, config) {
  program
        .command('info [project...]')
        .description('Shows the information for the supplied project(s)')
        .action(partial(ary(info, 2), config));
}

export default sicksyncInfoCommand;
