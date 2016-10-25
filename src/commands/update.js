import { partial } from 'lodash';
import { update } from '../update';

function sicksyncUpdateCommand(program, config) {
  program
        .command('update')
        .description('Updates sicksync on both your local and remote machine(s)')
        .option('-c, --check', 'Checks to see the latest version of sicksync')
        .option('-m, --migrate-config', 'Updates your config for the most recent version for sicksync')
        .action(partial(update, config));
}

export default sicksyncUpdateCommand;
