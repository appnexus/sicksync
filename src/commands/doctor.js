import * as doctor from '../doctor';

function sicksyncDoctor(program, config) {
    program
        .command('doctor')
        .description('Runs through a gammut of checks to make sure sicksync is working properly')
        .action(() => {
          doctor.checkAll(config);
        });
};

export default sicksyncDoctor;
