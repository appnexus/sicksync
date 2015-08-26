import { ary, partial } from 'lodash';
import { add } from '../project-helper';

function sicksyncAddProjectCommand(program, config) {
    program
        .command('add-project')
        .alias('add')
        .description('Adds a new project to sicksync.')
        .action(partial(ary(add, 1), config));
};

export default sicksyncAddProjectCommand;