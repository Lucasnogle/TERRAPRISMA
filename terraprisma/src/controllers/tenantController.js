const asyncHandler = require('../middlewares/asyncHandler');
const tenantService = require('../services/tenantService');
const { validateUpdatePreferences } = require('../validators/tenantValidator');

/**
 * GET /api/tenant - Retorna dados do tenant atual
 */
const getTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.getTenant(req.tenant.id);

    res.json({
        ok: true,
        data: tenant,
    });
});

module.exports = {
    getTenant,
};
