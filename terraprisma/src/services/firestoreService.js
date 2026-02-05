const admin = require('firebase-admin');
const { getFirestoreDb } = require('../modules/connectionFirestore');

/**
 * Cria um novo job no Firestore
 * @param {string} type - Tipo do job
 * @param {object} payload - Dados do job
 * @returns {Promise<{id: string, ...}>}
 */
const createJob = async (type, payload = {}) => {
    const db = getFirestoreDb();
    const jobData = {
        type,
        status: 'pending',
        payload,
        result: null,
        error: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('jobs').add(jobData);
    return { id: docRef.id, ...jobData };
};

/**
 * Atualiza um job existente
 * @param {string} jobId - ID do job
 * @param {object} patch - Campos a atualizar
 * @returns {Promise<void>}
 */
const updateJob = async (jobId, patch = {}) => {
    const db = getFirestoreDb();
    await db.collection('jobs').doc(jobId).update({
        ...patch,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Busca um job pelo ID
 * @param {string} jobId - ID do job
 * @returns {Promise<object|null>}
 */
const getJob = async (jobId) => {
    const db = getFirestoreDb();
    const doc = await db.collection('jobs').doc(jobId).get();

    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() };
};

/**
 * Lista jobs por tipo e/ou status
 * @param {object} filters - Filtros opcionais { type, status, limit }
 * @returns {Promise<object[]>}
 */
const listJobs = async (filters = {}) => {
    const db = getFirestoreDb();
    let query = db.collection('jobs');

    if (filters.type) {
        query = query.where('type', '==', filters.type);
    }
    if (filters.status) {
        query = query.where('status', '==', filters.status);
    }

    query = query.orderBy('createdAt', 'desc').limit(filters.limit || 50);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Atualiza o heartbeat do sistema
 * Usado pelo cron para indicar que o sistema está vivo
 */
const updateHeartbeat = async () => {
    const db = getFirestoreDb();
    await db.collection('ops').doc('heartbeat').set({
        lastBeat: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
};

module.exports = {
    createJob,
    updateJob,
    getJob,
    listJobs,
    updateHeartbeat,
};
