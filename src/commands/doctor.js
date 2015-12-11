import * as doctor from '../doctor';

function sicksyncDoctor(program, config) {
    program
        .command('doctor [project...]')
        .description('Runs through a gammut of checks to make sure sicksync is working properly')
        .action(() => {
            doctor.hasRightSicksyncVerions('jgriffith', '244.jgriffith.user.lax1.adnexus.net');
        });
};

export default sicksyncDoctor;
