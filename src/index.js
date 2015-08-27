import program from 'commander';
import { version } from '../package.json';
import { check, notify } from './update';
import { getConfig, printLogo } from './util';
import commands from './commands';

let config = getConfig();

commands(program, config);

function SickSync() {
    program
        .version(version)
        .usage('<command> [options]')
        .parse(process.argv);

    // Run help if no command is provided
    if (!process.argv.slice(2).length) {
        printLogo();
        program.outputHelp();
    }

    // Run/Display update notifications
    check();
    notify();
};

export default SickSync;
