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

    // Password is handled by Firebase Client SDK
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
    handleValidationErrors
};
