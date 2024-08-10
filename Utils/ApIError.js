class ApIError extends Error {
    constructor(statusCode, message = 'Something Went Wrong!', error = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.data = null;
        this.sucess = false;
        this.message = message;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

module.exports = ApIError;