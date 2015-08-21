import program from 'commander';
import packageJson from '../package.json';
import updates from './update';
import util from './util';

let config = util.getConfig();

require('./commands')(program, config);

export default function SicksyncProgram() {
    program
        .version(packageJson.version)
        .usage('<command> [options]')
        .parse(process.argv);

    // Run help if no command is provided
    if (!process.argv.slice(2).length) {
        util.printLogo();
        program.outputHelp();
    }

    // Run/Display update notifications
    updates.check();
    updates.notify();
};
