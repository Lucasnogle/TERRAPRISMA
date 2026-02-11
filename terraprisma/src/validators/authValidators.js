const { body, validationResult } = require('express-validator');

/**
 * Validation rules for POST /register
 * - username: required, min 3 chars, trimmed
 * - email: required, valid format, normalized to lowercase
 * - password: required, min 8 chars
 */
const registerValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username é obrigatório')
        .isLength({ min: 3 }).withMessage('Username precisa de no mínimo 3 caracteres'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email é obrigatório')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail({ gmail_remove_dots: false }), // lowercase + normalize

    body('password')
        .notEmpty().withMessage('Senha é obrigatória')
        .isLength({ min: 8 }).withMessage('Senha precisa de no mínimo 8 caracteres'),
];

/**
 * Validation rules for POST /authenticate
 * - login: required, trimmed (can be email or username)
 * - password: required
 */
const authenticateValidator = [
    body('login')
        .trim()
        .notEmpty().withMessage('Login é obrigatório'),

    body('password')
        .notEmpty().withMessage('Senha é obrigatória'),
];

/**
 * Middleware: check validation results and return 400 with structured errors.
 * Must be placed AFTER validator arrays in the middleware chain.
 *
 * Response format:
 * { error: "validation_error", details: [{ field, message }] }
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const details = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        return res.status(400).json({
            error: 'validation_error',
            details
        });
    }

    next();
};

module.exports = {
    registerValidator,
    authenticateValidator,
    handleValidationErrors
};
