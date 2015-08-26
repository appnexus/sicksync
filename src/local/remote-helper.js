import _ from 'lodash';
import { EventEmitter } from 'events';
import util from '../util';
import { REMOTE as remoteEvents } from '../../conf/events';
import { SERVER_ON_READY as  readyFlag } from '../../conf/text';

class RemoteHelper extends EventEmitter {
    constructor (params) {
        super();

        this._secret = params.secret;
        this._webSocketPort = params.websocketPort;
        this._username = params.username;
        this._hostname = params.hostname;
        this._prefersEncrypted = params.prefersEncrypted || false;
        this._debug = params.debug || false;
    }

    _startRemoteSicksync (ssh) {
        let context = this;

        ssh.stdin.write(
            ['sicksync remote',
                '-s', context._secret,
                '-p', context._webSocketPort,
                context._prefersEncrypted ? '-e': '',
                context._debug ? '-d': '',
                '\n'].join(' ')
        );
    }

    start () {
        let context = this;
        let bootSicksync = _.once(this._startRemoteSicksync.bind(this));
        let ssh = util.shellIntoRemote(this._username + '@' + this._hostname);

        ssh.stdout.on('data', (data) => {
            let message = data.toString();

            // Boot sicksync (once!)
            bootSicksync(ssh);

            // If we get a 'ready' flag back from the server, emit a ready event
            if (_.contains(message, readyFlag)) return context.emit(remoteEvents.READY);

            // If the message contains the devboxes name, emit the message
            if (_.contains(message, context._secret)) {
                let cleanedMessage = message.replace(context._secret, '').replace('\n', '');

                return context.emit(remoteEvents.MESSAGE, cleanedMessage);
            }

            // Command not found :(
            /* istanbul ignore else */
            if (_.contains(message, 'command not found')) {
                return context.emit(remoteEvents.ERROR, message);
            }
        });
    }
}

export default RemoteHelper;
