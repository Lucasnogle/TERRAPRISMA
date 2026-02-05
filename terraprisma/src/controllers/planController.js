const asyncHandler = require('../middlewares/asyncHandler');
const planService = require('../services/planService');
const jobService = require('../services/jobService');
const { validateRequestPlan, getDefaultWeekStart } = require('../validators/planValidator');
const { createError } = require('../middlewares/errorHandler');

/**
 * POST /api/segundaleve/plan - Solicita geração de plano semanal
 */
const requestPlan = asyncHandler(async (req, res) => {
    const validated = validateRequestPlan(req.body);
    const weekStart = validated.weekStart || getDefaultWeekStart();

    // Verificar se já existe plano para essa semana (idempotência)
    const existing = await planService.findPlanByTenantAndWeek(req.tenant.id, weekStart);
    if (existing) {
        return res.json({
            ok: true,
            data: {
                planId: existing.id,
                status: 'already_exists',
                plan: existing,
            },
        });
    }

    // Criar job para gerar plano
    const job = await jobService.createJob({
        type: 'plan.generate',
        tenantId: req.tenant.id,
        payload: {
            tenantId: req.tenant.id,
            weekStart,
            context: validated.context || '',
        },
    });

    res.status(202).json({
        ok: true,
        data: {
            jobId: job.id,
            status: 'queued',
            weekStart,
        },
    });
});

/**
 * GET /api/segundaleve/plans - Lista planos do tenant
 */
const listPlans = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const plans = await planService.listPlans(req.tenant.id, { limit });

    res.json({
        ok: true,
        data: {
            plans,
            count: plans.length,
        },
    });
});

/**
 * GET /api/segundaleve/plan/:id - Detalha um plano
 */
const getPlan = asyncHandler(async (req, res) => {
    const plan = await planService.getPlan(req.params.id, req.tenant.id);

    if (!plan) {
        throw createError(404, 'NOT_FOUND', 'Plan not found');
    }

    res.json({
        ok: true,
        data: plan,
    });
});

/**
 * POST /api/segundaleve/plan/:id/priority/:pid/complete - Marca prioridade como feita
 */
const completePriority = asyncHandler(async (req, res) => {
    const { id: planId, pid: priorityId } = req.params;

    const result = await planService.completePriority(planId, priorityId, req.tenant.id);

    if (!result.success) {
        throw createError(400, 'COMPLETE_FAILED', result.message);
    }

    res.json({
        ok: true,
        data: {
            priority: result.priority,
            message: result.message || 'Priority completed',
        },
    });
});

/**
 * DELETE /api/segundaleve/plan/:id - Deleta um plano
 */
const deletePlan = asyncHandler(async (req, res) => {
    const result = await planService.deletePlan(req.params.id, req.tenant.id);

    if (!result.success) {
        throw createError(404, 'NOT_FOUND', result.message || 'Plan not found');
    }

    res.json({
        ok: true,
        data: { message: 'Plan deleted successfully' },
    });
});

/**
 * PATCH /api/segundaleve/plan/:id - Atualiza contexto do plano
 */
const updatePlanContext = asyncHandler(async (req, res) => {
    const { context } = req.body;

    if (typeof context !== 'string') {
        throw createError(400, 'INVALID_INPUT', 'Context must be a string');
    }

    const result = await planService.updatePlanContext(req.params.id, context, req.tenant.id);

    if (!result.success) {
        throw createError(404, 'NOT_FOUND', result.message || 'Plan not found');
    }

    res.json({
        ok: true,
        data: result.plan,
    });
});

module.exports = {
    requestPlan,
    listPlans,
    getPlan,
    completePriority,
    deletePlan,
    updatePlanContext,
};
