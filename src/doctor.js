import { contains } from 'lodash';
import { shellIntoRemote } from './util';
import { Promise } from 'es6-promise';

export function canShellIntoHost(username, host) {
    return new Promise((resolve, reject) => {
        let ssh = shellIntoRemote(`${username}@${host}`);

        let timeoutId = setTimeout(() => {
            console.info(`Timed out waiting to connect to ${host} with user ${username}`);
            console.info(`Check to make sure your machine is reachable by by sshing: ${username}@${host}`);
            reject(false);
        }, 1000);

        ssh.stdout.on('data', () => {
            clearTimeout(timeoutId);
            console.info(`Successfully connected to ${host} with user ${username}`);
            resolve(true);
        });
    }) ;
}

export function hasSicksyncRemote(username, host) {
    return new Promise((resolve, reject) => {
        let ssh = shellIntoRemote(`${username}@${host}`);

        let timeoutId = setTimeout(() => {
            console.info(`Timed out waiting to connect to ${host} with user ${username}`);
            console.info(`Check to make sure your machine is reachable by sshing: ${username}@${host}`);
            reject(false);
        }, 1000);

        // See if we can find sicksync
        ssh.stdin.write('which sicksync');

        ssh.stdout.on('data', (data) => {
            let message = data.toString();

            clearTimeout(timeoutId);

            if (contains(message, 'no sicksync in')) {
                console.info(`Couldn't start sicksync on ${host} with user ${username}!`);
                console.info(`Check to ensure it's installed on your remote machine: 'npm i -g sicksync'`);
                console.info(`Lastly, check to make sure your .bashrc or .zshrc contains the npm global path.`);
                reject(false);
            } else {
                console.info(`Successfully started sicksync on host ${host} with user ${username}`);
                resolve(true);
            }
        });
    });
}
