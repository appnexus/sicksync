import { contains } from 'lodash';
import { Promise } from 'es6-promise';
import chalk from 'chalk';

import { shellIntoRemote } from './util';
import packageJson from '../package.json';

export function canShellIntoHost(username, host) {
    return new Promise((resolve, reject) => {
        let ssh = shellIntoRemote(`${username}@${host}`);

        let timeoutId = setTimeout(() => {
            console.info(chalk.red(`Timed out waiting to connect to ${host} with user ${username}`));
            console.info(chalk.red(`Check to make sure your machine is reachable by by sshing: ${username}@${host}`));
            ssh.kill();
            reject(false);
        }, 10000);

        ssh.stdout.on('data', () => {
            clearTimeout(timeoutId);
            console.info(`Successfully connected to ${host} with user ${username}`);
            ssh.kill();
            resolve(true);
        });
    }) ;
}

export function hasSicksyncRemote(username, host) {
    return new Promise((resolve, reject) => {
        let ssh = shellIntoRemote(`${username}@${host}`);

        let timeoutId = setTimeout(() => {
            clearAndKill();
            console.info(`Timed out waiting to connect to ${host} with user ${username}`);
            console.info(`Check to make sure your machine is reachable by sshing: ${username}@${host}`);
            reject(false);
        }, 10000);

        let clearAndKill = () => {
            ssh.kill();
            clearTimeout(timeoutId);
        };

        // See if we can find sicksync
        ssh.stdin.write('which sicksync\n');

        ssh.stdout.on('data', (data) => {
            let message = data.toString();

            if (contains(message, 'no sicksync in')) {
                clearAndKill();
                console.info(`Couldn't start sicksync on ${host} with user ${username}!`);
                console.info(`Check to ensure it's installed on your remote machine: 'npm i -g sicksync'`);
                console.info(`Lastly, check to make sure your .bashrc or .zshrc contains the npm global path.`);
                reject(false);
            } 

            if (contains(message, '/sicksync')) {
                clearAndKill();
                console.info(`Successfully started sicksync on host ${host} with user ${username}`);
                resolve(true);
            }
        });
    });
}

export function hasRightSicksyncVerions(username, host) {
    return new Promise((resolve, reject) => {
        let ssh = shellIntoRemote(`${username}@${host}`);

        let timeoutId = setTimeout(() => {
            clearAndKill();
            console.info(`Timed out waiting to connect to ${host} with user ${username}`);
            console.info(`Check to make sure your machine is reachable by sshing: ${username}@${host}`);
            reject(false);
        }, 10000);

        let clearAndKill = () => {
            ssh.kill();
            clearTimeout(timeoutId);
        };

        // See if sicksync is at the right version
        ssh.stdin.write('sicksync -V\n');

        ssh.stdout.on('data', (data) => {
            let message = data.toString();

            if (message.match(/^(\d+\.)?(\d+\.)?(\d+\.*)/g)) {
                let version = message.trim();
                clearAndKill();

                if (version !== packageJson.version) {
                    console.info('sicksync is at version', version, 'but is locally at version', packageJson.version);
                    console.info('Please make sure both machines are at the latest verions');
                    reject(false);
                } else {
                    console.info('Both machines are running the same version of sicksync!');
                    resolve(true);
                }
            }
        });
    });
}

export function hasConfig() {
  return new Promise((resolve, reject) => {

  });
}
