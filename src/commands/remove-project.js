import { ary, partial } from 'lodash';
import { remove } from '../project-helper';

function sicksyncRemoveProjectCommand(program, config) {
    program
        .command('remove-project <projects...>')
        .alias('rm')
        .description('Removes a project from sicksync.')
        .action(partial(ary(remove, 2), config));
};

export default sicksyncRemoveProjectCommand;
