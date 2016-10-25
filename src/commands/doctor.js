import { ary, partial } from 'lodash';

import { checkAll } from '../doctor';

function sicksyncDoctor(program, config) {
  program
    .command('doctor')
    .description('Runs through a gammut of checks to make sure sicksync is working properly')
    .action(partial(ary(checkAll, 1), config));
}

export default sicksyncDoctor;
