const { z } = require('zod');

// ============================================
// Plan Validators
// ============================================

/**
 * Schema para prioridade individual
 */
const prioritySchema = z.object({
    id: z.string(),
    title: z.string().min(1).max(500),
    category: z.string().optional(),
    reasoning: z.string().optional(),
    status: z.enum(['pending', 'completed']).default('pending'),
    completedAt: z.string().nullable().optional(),
});

/**
 * Schema para solicitar geração de plano
 */
const requestPlanSchema = z.object({
    context: z.string().max(2000).optional(),
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart deve ser YYYY-MM-DD').optional(),
});

/**
 * Schema para completar prioridade
 */
const completePrioritySchema = z.object({
    planId: z.string().min(1),
    priorityId: z.string().min(1),
});

/**
 * Valida request de criação de plano
 */
const validateRequestPlan = (data) => {
    return requestPlanSchema.parse(data);
};

/**
 * Valida request de completar prioridade
 */
const validateCompletePriority = (data) => {
    return completePrioritySchema.parse(data);
};

/**
 * Gera weekStart se não fornecido (domingo atual ou próximo)
 */
const getDefaultWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Se for domingo, usa hoje; senão, próximo domingo
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    return sunday.toISOString().split('T')[0];
};

module.exports = {
    prioritySchema,
    requestPlanSchema,
    completePrioritySchema,
    validateRequestPlan,
    validateCompletePriority,
    getDefaultWeekStart,
};
