const admin = require('firebase-admin');
const { getFirestore } = require('../modules/connectionFirestore');
const { hashApiKey } = require('../middlewares/apiKey');
const { loggers } = require('../utils/logger');

/**
 * Cria um novo tenant
 * @param {{ name: string, email: string }} data
 * @returns {Promise<{ id: string, apiKey: string }>}
 */
const createTenant = async ({ name, email }) => {
    const db = getFirestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Criar tenant
    const tenantData = {
        name,
        email,
        createdAt: now,
        updatedAt: now,
    };

    const tenantRef = await db.collection('tenants').add(tenantData);

    // Gerar API key única
    const rawApiKey = `sl_${require('crypto').randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(rawApiKey);

    // Salvar API key (hash como ID)
    await db.collection('api_keys').doc(keyHash).set({
        tenantId: tenantRef.id,
        name: 'default',
        createdAt: now,
        revokedAt: null,
    });

    loggers.api.info(`Tenant created: ${tenantRef.id}`, { email });

    return {
        id: tenantRef.id,
        apiKey: rawApiKey, // Retorna a key original (única vez que é visível)
        ...tenantData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

/**
 * Busca tenant por ID
 * @param {string} tenantId
 * @returns {Promise<object|null>}
 */
const getTenant = async (tenantId) => {
    if (tenantId === 'dev_tenant_id') {
        return {
            id: 'dev_tenant_id',
            name: 'Tenant de Desenvolvimento',
            email: 'dev@terraprisma.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    const db = getFirestore();
    const doc = await db.collection('tenants').doc(tenantId).get();

    if (!doc.exists) return null;

    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
};

/**
 * Lista todos os tenants ativos (para cron)
 * @returns {Promise<object[]>}
 */
const listActiveTenants = async () => {
    const db = getFirestore();
    const snapshot = await db.collection('tenants').get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
};

module.exports = {
    createTenant,
    getTenant,
    listActiveTenants,
};
