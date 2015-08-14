module.exports = {
    FS: {
        ADD: 'add',
        CHANGE: 'change',
        LARGE: 'large-change'
    },
    REMOTE: {
        READY: 'ready',
        ERROR: 'error',
        MESSAGE: 'message'
    },
    WS: {
        CLIENT: {
            DISCONNECTED: 'disconnected',
            RECONNECTING: 'reconnecting',
            REMOTE_MESSAGE: 'remote-message',
            REMOTE_ERROR: 'remote-error'
        },
        SERVER: {
            UNAUTHORIZED: 'unauthorized',
            FILE_CHANGE: 'file-change',
            CONNECTION_CLOSED: 'connection-closed'
        }
    }
};
