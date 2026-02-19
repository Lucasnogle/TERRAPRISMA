const { getStore } = require('./requestContextNodeMiddleware');

const errorHandler = (err, req, res, next) => {
    const store = getStore();
    const correlationId = store?.correlationId || 'unknown';

    // Log the error
    console.error(`[ERROR] ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        correlationId
    });

    // Default status 500
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';

    // Sanitize message for production
    const message = status === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

    res.status(status).json({
        error: {
            code,
            message,
            correlationId
        }
    });
};

module.exports = errorHandler;
