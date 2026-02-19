const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const als = new AsyncLocalStorage();

const middleware = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

    // Set headers for downstream
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    // Initial store
    const store = {
        correlationId,
        tenantId: null, // Will be populated by auth middleware
        userId: null
    };

    als.run(store, () => {
        next();
    });
};

const getStore = () => als.getStore();

module.exports = {
    middleware,
    getStore
};
