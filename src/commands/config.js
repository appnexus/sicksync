import { partial } from 'lodash';
import { open, getConfigPath } from '../util';

function sicksyncConfigCommand(program/*, config */) {
  program
        .command('config')
        .description('Opens the sicksync config file in your chosen editor.')
        .action(partial(open, getConfigPath()));
}

export default sicksyncConfigCommand;
