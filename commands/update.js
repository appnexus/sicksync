var update = require('../lib/update').update;

module.exports = function sicksyncOnceCommand(program) {
    program
        .command('update')
        .description('Updates sicksync on both your local and remote machines')
        .action(update);
};
