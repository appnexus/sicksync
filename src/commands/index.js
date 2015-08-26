import { join } from 'path';

function getCommands(program, config) {
    require('fs').readdirSync(join(__dirname)).forEach(function(file) {
        if (file !== 'index.js') require('./' + file)(program, config);
    });
};

export default getCommands;
