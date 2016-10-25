import { join } from 'path';
import { readdirSync } from 'fs-extra';

export function generateCommands(program, config) {
  readdirSync(join(__dirname)).forEach(function(file) {
    if (file !== 'index.js') {
      require('./' + file).default(program, config);
    }
  });
}

export default generateCommands;
