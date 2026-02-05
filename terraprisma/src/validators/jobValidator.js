const { z } = require('zod');

// ============================================
// Job Payload Validators
// ============================================

/**
 * Schema para job plan.generate
 */
const planGeneratePayloadSchema = z.object({
    tenantId: z.string().min(1),
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    context: z.string().max(2000).optional(),
});

/**
 * Schema para job notify.email
 */
const notifyEmailPayloadSchema = z.object({
    tenantId: z.string().min(1),
    planId: z.string().min(1),
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    templateType: z.enum(['weekly_plan']),
});

/**
 * Schema para job plan.complete_priority
 */
const completePriorityPayloadSchema = z.object({
    tenantId: z.string().min(1),
    planId: z.string().min(1),
    priorityId: z.string().min(1),
});

/**
 * Schema para job cron.weekly_plans
 */
const cronWeeklyPlansPayloadSchema = z.object({
    triggerTime: z.string(),
    batchId: z.string(),
});

/**
 * Valida payload de plan.generate
 */
const validatePlanGeneratePayload = (data) => {
    return planGeneratePayloadSchema.parse(data);
};

/**
 * Valida payload de notify.email
 */
const validateNotifyEmailPayload = (data) => {
    return notifyEmailPayloadSchema.parse(data);
};

/**
 * Valida payload de plan.complete_priority
 */
const validateCompletePriorityPayload = (data) => {
    return completePriorityPayloadSchema.parse(data);
};

module.exports = {
    planGeneratePayloadSchema,
    notifyEmailPayloadSchema,
    completePriorityPayloadSchema,
    cronWeeklyPlansPayloadSchema,
    validatePlanGeneratePayload,
    validateNotifyEmailPayload,
    validateCompletePriorityPayload,
};
