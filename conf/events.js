module.exports = {
    FS: {
        LOCAL: {
            CHANGE: 'file-change',
            LARGE: 'large-change'
        },
        REMOTE: {
            ADD_FILE: 'add-file',
            ADD_FILE_ERROR: 'add-file-error',
            ADD_DIR: 'add-dir',
            ADD_DIR_ERROR: 'add-dir-error',
            DELETE: 'delete',
            DELETE_ERROR: 'delete-error'
        }
    },
    REMOTE: {
        READY: 'ready',
        ERROR: 'error',
        MESSAGE: 'message',
        NOT_FOUND: 'not-found'
    },
    WS: {
        LOCAL: {
            DISCONNECTED: 'disconnected',
            RECONNECTING: 'reconnecting',
            REMOTE_MESSAGE: 'remote-message',
            REMOTE_ERROR: 'remote-error',
            REMOTE_NOT_FOUND: 'remote-not-found',
            READY: 'ready'
        },
        REMOTE: {
            UNAUTHORIZED: 'unauthorized',
            FILE_CHANGE: 'file-change',
            CONNECTION_CLOSED: 'connection-closed'
        }
    }
};
