const asyncHandler = require('../middlewares/asyncHandler');
const jobService = require('../services/jobService');
const { createError } = require('../middlewares/errorHandler');

/**
 * POST /api/jobs - Criar novo job
 */
const create = asyncHandler(async (req, res) => {
    const { type, payload } = req.body;

    if (!type || typeof type !== 'string') {
        throw createError(400, 'VALIDATION_ERROR', 'type is required and must be string');
    }

    const job = await jobService.createJob({
        type,
        payload: payload || {},
        tenantId: req.tenant?.id || null,
    });

    res.status(201).json({
        ok: true,
        data: job,
    });
});

/**
 * GET /api/jobs - Listar jobs do tenant
 */
const list = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;

    const jobs = await jobService.listJobs({
        limit,
        status,
        tenantId: req.tenant?.id || null,
    });

    res.json({
        ok: true,
        data: {
            jobs,
            count: jobs.length,
        },
    });
});

/**
 * GET /api/jobs/:id - Detalhar job
 */
const get = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const job = await jobService.getJob(id, req.tenant?.id || null);

    if (!job) {
        throw createError(404, 'NOT_FOUND', 'Job not found');
    }

    res.json({
        ok: true,
        data: job,
    });
});

/**
 * POST /api/jobs/:id/retry - Retry de job com erro
 */
const retry = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await jobService.retryJob(id, req.tenant?.id || null);

    if (!result.success) {
        throw createError(400, 'RETRY_FAILED', result.message);
    }

    res.json({
        ok: true,
        data: {
            message: 'Job queued for retry',
        },
    });
});

/**
 * POST /api/jobs/:id/cancel - Cancelar job
 */
const cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await jobService.cancelJob(id, req.tenant?.id || null);

    if (!result.success) {
        throw createError(400, 'CANCEL_FAILED', result.message);
    }

    res.json({
        ok: true,
        data: {
            message: 'Job cancelled',
        },
    });
});

module.exports = {
    create,
    list,
    get,
    retry,
    cancel,
};
