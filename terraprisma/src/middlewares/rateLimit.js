const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter para rotas da API
 * 
 * Em desenvolvimento usa MemoryStore (padrão)
 * Em produção: usar Redis ou outro store externo para clusters
 * 
 * Exemplo com Redis:
 * const RedisStore = require('rate-limit-redis');
 * const redisClient = require('./redis');
 * store: new RedisStore({ client: redisClient })
 */

// Configurações
const WINDOW_MS = 60 * 1000; // 1 minuto

/**
 * Rate limit padrão para GET /api/*
 * 120 requests por minuto por IP
 */
const apiGetLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    // Usa IP padrão (sem customização para evitar erro)
    handler: (req, res) => {
        res.status(429).json({
            ok: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(WINDOW_MS / 1000),
            },
        });
    },
    skip: (req) => {
        // Não aplica em rotas públicas
        return !req.path.startsWith('/api');
    },
});

/**
 * Rate limit estrito para POST de criação de recursos
 * 30 requests por minuto por IP
 */
const apiPostLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            ok: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many write requests. Please slow down.',
                retryAfter: Math.ceil(WINDOW_MS / 1000),
            },
        });
    },
});

/**
 * Rate limit muito estrito para operações sensíveis
 * 10 requests por minuto (ex: retry, cancel)
 */
const apiSensitiveLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            ok: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many sensitive operations. Please wait.',
                retryAfter: Math.ceil(WINDOW_MS / 1000),
            },
        });
    },
});

module.exports = {
    apiGetLimiter,
    apiPostLimiter,
    apiSensitiveLimiter,
};
