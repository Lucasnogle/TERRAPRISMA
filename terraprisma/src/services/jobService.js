const admin = require('firebase-admin');
const { getDb } = require('../modules/connectionFirebase');

/**
 * Creates a new job in the queue
 * @param {{ type: string, payload: object, tenantId?: string }} data
 * @returns {Promise<{ id: string, ...job }>}
 */
const createJob = async ({ type, payload = {}, tenantId = null }) => {
    const db = await getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const jobData = {
        type,
        status: 'queued',
        payload,
        tenantId,
        result: null,
        error: null,
        createdAt: now,
        updatedAt: now,
        lockedAt: null,
        attempts: 0,
    };

    const docRef = await db.collection('tasks').add(jobData);
    console.log(`Job created: ${docRef.id}`, { type });

    return {
        id: docRef.id,
        ...jobData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

/**
 * Claims the next queued job (transactional lock)
 */
const claimNextJob = async () => {
    const db = await getDb();

    // Query for queued jobs
    const snapshot = await db.collection('tasks')
        .where('status', '==', 'queued')
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const jobDoc = snapshot.docs[0];
    const jobRef = db.collection('tasks').doc(jobDoc.id);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(jobRef);

            if (!freshDoc.exists) return null;
            const data = freshDoc.data();
            if (data.status !== 'queued') return null;

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
        console.error('[WORKER] Error in claimNextJob:', error.message);
        return null;
    }
};

const completeJob = async (id, result) => {
    const db = await getDb();
    await db.collection('tasks').doc(id).update({
        status: 'success',
        result,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

const failJob = async (id, error) => {
    const db = await getDb();
    await db.collection('tasks').doc(id).update({
        status: 'error',
        error: {
            message: error.message || String(error),
            stack: error.stack || null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

module.exports = {
    createJob,
    claimNextJob,
    completeJob,
    failJob,
};
