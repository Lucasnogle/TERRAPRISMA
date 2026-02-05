const admin = require('firebase-admin');
const { getFirestore } = require('../modules/connectionFirestore');
const { getDefaultWeekStart } = require('../validators/planValidator');
const { loggers } = require('../utils/logger');

/**
 * Busca plano existente por tenant + weekStart (idempotência)
 * @param {string} tenantId
 * @param {string} weekStart
 * @returns {Promise<object|null>}
 */
const findPlanByTenantAndWeek = async (tenantId, weekStart) => {
    const db = getFirestore();
    const snapshot = await db.collection('plans')
        .where('tenantId', '==', tenantId)
        .where('weekStart', '==', weekStart)
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate?.()?.toISOString() || null,
        deliveredAt: doc.data().deliveredAt?.toDate?.()?.toISOString() || null,
    };
};

/**
 * Cria um novo plano semanal
 * @param {{ tenantId: string, weekStart: string, priorities: Array, context?: string }} data
 * @returns {Promise<object>}
 */
const createPlan = async ({ tenantId, weekStart, priorities, context = '' }) => {
    const db = getFirestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const planData = {
        tenantId,
        weekStart,
        priorities: priorities.map((p, idx) => ({
            id: `prio_${idx + 1}_${Date.now()}`,
            title: p.title,
            category: p.category || 'geral',
            reasoning: p.reasoning || '',
            status: 'pending',
            completedAt: null,
        })),
        context,
        generatedAt: now,
        deliveredAt: null,
    };

    const docRef = await db.collection('plans').add(planData);

    loggers.api.info(`Plan created: ${docRef.id}`, { tenantId, weekStart });

    return {
        id: docRef.id,
        ...planData,
        generatedAt: new Date().toISOString(),
    };
};

/**
 * Lista planos de um tenant
 * @param {string} tenantId
 * @param {{ limit?: number }} options
 * @returns {Promise<object[]>}
 */
const listPlans = async (tenantId, { limit = 10 } = {}) => {
    const db = getFirestore();
    const snapshot = await db.collection('plans')
        .where('tenantId', '==', tenantId)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate?.()?.toISOString() || null,
        deliveredAt: doc.data().deliveredAt?.toDate?.()?.toISOString() || null,
    }));
};

/**
 * Busca plano por ID (com validação de tenant)
 * @param {string} planId
 * @param {string} tenantId
 * @returns {Promise<object|null>}
 */
const getPlan = async (planId, tenantId) => {
    const db = getFirestore();
    const doc = await db.collection('plans').doc(planId).get();

    if (!doc.exists) return null;

    const data = doc.data();

    // Validação de tenant
    if (data.tenantId !== tenantId) return null;

    return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt?.toDate?.()?.toISOString() || null,
        deliveredAt: data.deliveredAt?.toDate?.()?.toISOString() || null,
    };
};

/**
 * Marca prioridade como completada (idempotente)
 * @param {string} planId
 * @param {string} priorityId
 * @param {string} tenantId
 * @returns {Promise<{ success: boolean, priority?: object, message?: string }>}
 */
const completePriority = async (planId, priorityId, tenantId) => {
    const db = getFirestore();
    const planRef = db.collection('plans').doc(planId);
    const doc = await planRef.get();

    if (!doc.exists) {
        return { success: false, message: 'Plan not found' };
    }

    const data = doc.data();

    // Validação de tenant
    if (data.tenantId !== tenantId) {
        return { success: false, message: 'Plan not found' };
    }

    // Encontrar prioridade
    const priorities = data.priorities || [];
    const priorityIndex = priorities.findIndex(p => p.id === priorityId);

    if (priorityIndex === -1) {
        return { success: false, message: 'Priority not found' };
    }

    const priority = priorities[priorityIndex];

    // Idempotência: se já completada, retorna igual
    if (priority.status === 'completed') {
        return { success: true, priority, message: 'Already completed' };
    }

    // Atualizar
    priorities[priorityIndex] = {
        ...priority,
        status: 'completed',
        completedAt: new Date().toISOString(),
    };

    await planRef.update({ priorities });

    loggers.api.info(`Priority completed: ${priorityId}`, { planId });

    return { success: true, priority: priorities[priorityIndex] };
};

/**
 * Marca plano como entregue por email
 * @param {string} planId
 * @returns {Promise<boolean>}
 */
const markPlanDelivered = async (planId) => {
    const db = getFirestore();
    await db.collection('plans').doc(planId).update({
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
};

/**
 * Deleta um plano
 * @param {string} planId
 * @param {string} tenantId
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const deletePlan = async (planId, tenantId) => {
    const db = getFirestore();
    const planRef = db.collection('plans').doc(planId);
    const doc = await planRef.get();

    if (!doc.exists) {
        return { success: false, message: 'Plan not found' };
    }

    const data = doc.data();

    // Validação de tenant
    if (data.tenantId !== tenantId) {
        return { success: false, message: 'Plan not found' };
    }

    await planRef.delete();
    loggers.api.info(`Plan deleted: ${planId}`, { tenantId });

    return { success: true };
};

/**
 * Atualiza o contexto do plano
 * @param {string} planId
 * @param {string} context
 * @param {string} tenantId
 * @returns {Promise<{ success: boolean, plan?: object, message?: string }>}
 */
const updatePlanContext = async (planId, context, tenantId) => {
    const db = getFirestore();
    const planRef = db.collection('plans').doc(planId);
    const doc = await planRef.get();

    if (!doc.exists) {
        return { success: false, message: 'Plan not found' };
    }

    const data = doc.data();

    // Validação de tenant
    if (data.tenantId !== tenantId) {
        return { success: false, message: 'Plan not found' };
    }

    await planRef.update({
        context,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    loggers.api.info(`Plan context updated: ${planId}`, { tenantId });

    return { success: true, plan: { ...data, context } };
};

module.exports = {
    findPlanByTenantAndWeek,
    createPlan,
    listPlans,
    getPlan,
    completePriority,
    markPlanDelivered,
    getDefaultWeekStart,
    deletePlan,
    updatePlanContext,
};
