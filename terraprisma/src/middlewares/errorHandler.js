const { ZodError } = require('zod');

/**
 * Middleware centralizado de tratamento de erros
 * Deve ser o último middleware no app.js
 */
const errorHandler = (err, req, res, _next) => {
    // Log do erro (sem expor secrets)
    console.error(`[API] Error:`, {
        message: err.message,
        path: req.path,
        method: req.method,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });

    // Erro de validação Zod
    if (err instanceof ZodError) {
        return res.status(400).json({
            ok: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Dados inválidos',
                details: err.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
    }

    // Erro customizado com statusCode
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            ok: false,
            error: {
                code: err.code || 'ERROR',
                message: err.message,
            },
        });
    }

    // Erro do Firestore
    if (err.code && typeof err.code === 'number') {
        const firestoreErrors = {
            3: { status: 400, code: 'INVALID_ARGUMENT' },
            5: { status: 404, code: 'NOT_FOUND' },
            6: { status: 409, code: 'ALREADY_EXISTS' },
            7: { status: 403, code: 'PERMISSION_DENIED' },
            16: { status: 401, code: 'UNAUTHENTICATED' },
        };

        const mapped = firestoreErrors[err.code];
        if (mapped) {
            return res.status(mapped.status).json({
                ok: false,
                error: {
                    code: mapped.code,
                    message: err.message || 'Firestore error',
                },
            });
        }
    }

    // Erro genérico
    res.status(500).json({
        ok: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Erro interno do servidor'
                : err.message,
        },
    });
};

/**
 * Cria um erro customizado com statusCode
 */
const createError = (statusCode, code, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = code;
    return err;
};

module.exports = { errorHandler, createError };
