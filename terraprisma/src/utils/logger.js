const { v4: uuidv4 } = require('uuid');

/**
 * Logger estruturado simples
 * 
 * Formato: [PREFIXO] [TIMESTAMP] [REQUEST_ID] message { metadata }
 * 
 * Em produção: substituir por Winston com transporte para Cloud Logging
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

const currentLevel = process.env.LOG_LEVEL
    ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
    : LOG_LEVELS.INFO;

/**
 * Formata metadata para log (remove undefined, limita tamanho)
 */
const formatMeta = (meta) => {
    if (!meta || Object.keys(meta).length === 0) return '';

    const cleaned = {};
    for (const [key, value] of Object.entries(meta)) {
        if (value !== undefined && value !== null) {
            // Limita strings longas
            if (typeof value === 'string' && value.length > 200) {
                cleaned[key] = value.substring(0, 200) + '...';
            } else {
                cleaned[key] = value;
            }
        }
    }

    return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : '';
};

/**
 * Cria um logger com prefixo específico
 */
const createLogger = (prefix) => {
    const log = (level, levelName, message, meta = {}) => {
        if (level < currentLevel) return;

        const timestamp = new Date().toISOString();
        const requestId = meta.requestId || '-';
        const metaStr = formatMeta(meta);

        const output = `[${prefix}] [${timestamp}] [${requestId}] ${message}${metaStr ? ' ' + metaStr : ''}`;

        if (level >= LOG_LEVELS.ERROR) {
            console.error(output);
        } else if (level >= LOG_LEVELS.WARN) {
            console.warn(output);
        } else {
            console.log(output);
        }
    };

    return {
        debug: (message, meta) => log(LOG_LEVELS.DEBUG, 'DEBUG', message, meta),
        info: (message, meta) => log(LOG_LEVELS.INFO, 'INFO', message, meta),
        warn: (message, meta) => log(LOG_LEVELS.WARN, 'WARN', message, meta),
        error: (message, meta) => log(LOG_LEVELS.ERROR, 'ERROR', message, meta),
    };
};

// Loggers pré-configurados
const loggers = {
    api: createLogger('API'),
    worker: createLogger('WORKER'),
    cron: createLogger('CRON'),
    firestore: createLogger('FIRESTORE'),
    email: createLogger('EMAIL'),
    ai: createLogger('AI'),
};

/**
 * Middleware para adicionar requestId a cada request
 */
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4().slice(0, 8);
    res.setHeader('x-request-id', req.requestId);
    next();
};

/**
 * Middleware para log de requests
 */
const requestLogMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: duration,
            tenantId: req.tenant?.id,
        };

        if (res.statusCode >= 400) {
            loggers.api.warn(`${req.method} ${req.path} ${res.statusCode}`, meta);
        } else {
            loggers.api.info(`${req.method} ${req.path} ${res.statusCode}`, meta);
        }
    });

    next();
};

module.exports = {
    createLogger,
    loggers,
    requestIdMiddleware,
    requestLogMiddleware,
};
