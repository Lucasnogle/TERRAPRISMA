const admin = require('firebase-admin');
const { getFirestore } = require('../modules/connectionFirestore');
const config = require('../config');
const { loggers } = require('../utils/logger');

// Status finais (Dead Letter Queue)
const FINAL_STATUSES = ['success', 'cancelled', 'error_final'];
const RETRYABLE_STATUSES = ['error']; // Apenas 'error' pode ser retried

/**
 * Cria um novo job na fila
 * @param {{ type: string, payload: object, tenantId?: string }} data
 * @returns {Promise<{ id: string, ...job }>}
 */
const createJob = async ({ type, payload = {}, tenantId = null }) => {
    const db = getFirestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const jobData = {
        type,
        status: 'queued',
        payload,
        tenantId, // Multi-tenant support
        result: null,
        error: null,
        createdAt: now,
        updatedAt: now,
        lockedAt: null,
        attempts: 0,
    };

    const docRef = await db.collection('jobs').add(jobData);

    // TODO(SEGUNDA-LEVE): Add correlation ID for job tracing
    loggers.api.info(`Job created: ${docRef.id}`, { type, tenantId: tenantId || 'system' });

    return {
        id: docRef.id,
        ...jobData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

/**
 * Lista jobs ordenados por createdAt desc
 * @param {{ limit?: number, status?: string, tenantId?: string }} options
 * @returns {Promise<object[]>}
 */
const listJobs = async ({ limit = 20, status = null, tenantId = null } = {}) => {
    const db = getFirestore();
    let query = db.collection('jobs');

    // Filtro por tenant (se especificado)
    if (tenantId) {
        query = query.where('tenantId', '==', tenantId);
    }

    // Ordenação (sem orderBy se tiver where para evitar índice)
    // Para produção: criar índice composto
    const snapshot = await query.limit(limit).get();

    let jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        lockedAt: doc.data().lockedAt?.toDate?.()?.toISOString() || null,
    }));

    // Ordenar em memória (workaround para evitar índice)
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (status) {
        jobs = jobs.filter(j => j.status === status);
    }

    return jobs.slice(0, limit);
};

/**
 * Busca um job pelo ID
 * @param {string} id
 * @param {string|null} tenantId - Se fornecido, valida pertencimento
 * @returns {Promise<object|null>}
 */
const getJob = async (id, tenantId = null) => {
    const db = getFirestore();
    const doc = await db.collection('jobs').doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();

    // Validação de tenant se especificado
    if (tenantId && data.tenantId !== tenantId) {
        return null;
    }

    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lockedAt: data.lockedAt?.toDate?.()?.toISOString() || null,
    };
};

/**
 * Retry de um job com erro (não permite retry de error_final)
 * @param {string} id
 * @param {string|null} tenantId
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const retryJob = async (id, tenantId = null) => {
    const db = getFirestore();
    const docRef = db.collection('jobs').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return { success: false, message: 'job not found' };
    }

    const data = doc.data();

    // Validação de tenant
    if (tenantId && data.tenantId !== tenantId) {
        return { success: false, message: 'job not found' };
    }

    // Apenas status 'error' pode ser retried (não error_final)
    if (!RETRYABLE_STATUSES.includes(data.status)) {
        return { success: false, message: `only ${RETRYABLE_STATUSES.join(', ')} jobs can be retried` };
    }

    await docRef.update({
        status: 'queued',
        result: null,
        error: null,
        lockedAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: admin.firestore.FieldValue.increment(1),
    });

    return { success: true };
};

/**
 * Cancela um job queued ou running
 * @param {string} id
 * @param {string|null} tenantId
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const cancelJob = async (id, tenantId = null) => {
    const db = getFirestore();
    const docRef = db.collection('jobs').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return { success: false, message: 'job not found' };
    }

    const data = doc.data();

    // Validação de tenant
    if (tenantId && data.tenantId !== tenantId) {
        return { success: false, message: 'job not found' };
    }

    if (!['queued', 'running'].includes(data.status)) {
        return { success: false, message: 'only queued or running jobs can be cancelled' };
    }

    await docRef.update({
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
};

/**
 * Claim do próximo job queued (com transaction para lock)
 * Nota: Não usa orderBy para evitar necessidade de índice composto
 * @returns {Promise<object|null>}
 */
const claimNextJob = async () => {
    const db = getFirestore();

    // Busca jobs queued (sem orderBy para evitar índice)
    const snapshot = await db.collection('jobs')
        .where('status', '==', 'queued')
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const jobDoc = snapshot.docs[0];
    const jobRef = db.collection('jobs').doc(jobDoc.id);

    // Transaction para garantir lock atômico
    try {
        const result = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(jobRef);

            if (!freshDoc.exists) return null;

            const data = freshDoc.data();

            // Revalidar que ainda está queued
            if (data.status !== 'queued') return null;

            // Lock do job
            transaction.update(jobRef, {
                status: 'running',
                lockedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                attempts: admin.firestore.FieldValue.increment(1),
            });

            return {
                id: freshDoc.id,
                ...data,
            };
        });

        return result;
    } catch (error) {
        console.error('[WORKER] Erro no claimNextJob:', error.message);
        return null;
    }
};

/**
 * Atualiza um job com sucesso
 * @param {string} id
 * @param {object} result
 */
const completeJob = async (id, result) => {
    const db = getFirestore();
    await db.collection('jobs').doc(id).update({
        status: 'success',
        result,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Atualiza um job com erro
 * @param {string} id
 * @param {{ message: string, stack?: string, code?: string }} error
 */
const failJob = async (id, error) => {
    const db = getFirestore();
    await db.collection('jobs').doc(id).update({
        status: 'error',
        error: {
            code: error.code || 'PROCESSING_ERROR',
            message: error.message || String(error),
            stack: error.stack || null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Marca um job como error_final (Dead Letter Queue)
 * @param {string} id
 * @param {string} reason
 */
const markJobFinal = async (id, reason) => {
    const db = getFirestore();
    await db.collection('jobs').doc(id).update({
        status: 'error_final',
        error: {
            code: 'MAX_ATTEMPTS_EXCEEDED',
            message: reason,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Recupera jobs travados (running por muito tempo)
 * @returns {Promise<{ recovered: number, movedToFinal: number }>}
 */
const recoverStuckJobs = async () => {
    const db = getFirestore();
    const timeoutMinutes = config.job.runningTimeoutMinutes || 10;
    const maxAttempts = config.job.maxAttempts || 3;
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const snapshot = await db.collection('jobs')
        .where('status', '==', 'running')
        .get();

    let recovered = 0;
    let movedToFinal = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const lockedAt = data.lockedAt?.toDate?.();

        // Verificar se está travado há mais tempo que o timeout
        if (lockedAt && lockedAt < cutoffTime) {
            if ((data.attempts || 0) >= maxAttempts) {
                // Mover para Dead Letter Queue
                await markJobFinal(doc.id, `Job stuck after ${maxAttempts} attempts. Timeout: ${timeoutMinutes}min`);
                movedToFinal++;
                loggers.cron.warn(`Job moved to DLQ: ${doc.id}`, { attempts: data.attempts });
            } else {
                // Recuperar para queued
                await db.collection('jobs').doc(doc.id).update({
                    status: 'queued',
                    lockedAt: null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                recovered++;
                loggers.cron.info(`Job recovered: ${doc.id}`, { attempts: data.attempts });
            }
        }
    }

    return { recovered, movedToFinal };
};

/**
 * Obtém métricas de jobs
 * @returns {Promise<object>}
 */
const getJobMetrics = async () => {
    const db = getFirestore();
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Contagens por status (todos os tempos)
    const allJobs = await db.collection('jobs').get();

    const counts = {
        queued: 0,
        running: 0,
        success: 0,
        error: 0,
        error_final: 0,
        cancelled: 0,
    };

    const last24hCounts = {
        success: 0,
        error: 0,
        error_final: 0,
    };

    for (const doc of allJobs.docs) {
        const data = doc.data();
        const status = data.status || 'unknown';

        if (Object.prototype.hasOwnProperty.call(counts, status)) {
            counts[status]++;
        }

        // Últimas 24h (baseado em updatedAt)
        const updatedAt = data.updatedAt?.toDate?.();
        if (updatedAt && updatedAt > last24h) {
            if (status === 'success') last24hCounts.success++;
            if (status === 'error') last24hCounts.error++;
            if (status === 'error_final') last24hCounts.error_final++;
        }
    }

    return {
        total: allJobs.size,
        byStatus: counts,
        last24h: last24hCounts,
        timestamp: now.toISOString(),
    };
};

module.exports = {
    createJob,
    listJobs,
    getJob,
    retryJob,
    cancelJob,
    claimNextJob,
    completeJob,
    failJob,
    markJobFinal,
    recoverStuckJobs,
    getJobMetrics,
    FINAL_STATUSES,
    RETRYABLE_STATUSES,
};
