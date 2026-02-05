const { z } = require('zod');

// ============================================
// Tenant Validators
// ============================================

/**
 * Schema para criar tenant
 */
const createTenantSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
});

/**
 * Valida e parseia dados de criação de tenant
 */
const validateCreateTenant = (data) => {
    return createTenantSchema.parse(data);
};

module.exports = {
    createTenantSchema,
    validateCreateTenant,
};
