const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { loggers } = require('../utils/logger');

let app = null;
let db = null;

/**
 * Inicializa o Firebase Admin SDK (singleton)
 * Suporta dois modos:
 * 1. Service Account JSON (local): usa FIREBASE_SERVICE_ACCOUNT_PATH
 * 2. Application Default Credentials (ADC): em Cloud Run/GCE quando não há service account
 */
const initializeFirebase = () => {
    if (app) return app;

    try {
        const serviceAccountPath = config.firebase.serviceAccountPath;
        const absolutePath = serviceAccountPath
            ? path.resolve(process.cwd(), serviceAccountPath)
            : null;

        // Modo 1: Service Account JSON (local/server próprio)
        if (absolutePath && fs.existsSync(absolutePath)) {
            const serviceAccount = require(absolutePath);

            // Valida se é um service account válido (não placeholder)
            if (!serviceAccount.private_key || serviceAccount.private_key.includes('SEU_PROJECT_ID')) {
                throw new Error(
                    'Service account inválido ou placeholder. ' +
                    'Cole seu JSON real em: ' + absolutePath
                );
            }

            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || config.firebase.projectId,
            });


            loggers.firestore.info(`Initialized with Service Account (${serviceAccountPath})`);
        }
        // Modo 2: Application Default Credentials (Cloud Run/GCE)
        else {
            app = admin.initializeApp({
                projectId: config.firebase.projectId,
            });

            loggers.firestore.info('Initialized with Application Default Credentials (ADC)');
        }

        return app;
    } catch (error) {
        loggers.firestore.error('Failed to initialize', { error: error.message });
        throw error;
    }
};

/**
 * Retorna instância do Firestore (singleton)
 */
const getFirestore = () => {
    if (db) return db;

    initializeFirebase();
    db = admin.firestore();

    // Configura database ID se especificado
    if (config.firebase.databaseId) {
        db = admin.firestore(config.firebase.databaseId);
    }

    return db;
};

/**
 * Health check do Firestore
 * Faz uma operação leve para validar conexão
 * @returns {Promise<{ok: boolean, latencyMs?: number, error?: string}>}
 */
const healthCheckFirestore = async () => {
    const startTime = Date.now();

    try {
        const firestore = getFirestore();

        // Lista coleções raiz (operação leve que requer menos permissões)
        const collections = await firestore.listCollections();

        const latencyMs = Date.now() - startTime;

        return {
            ok: true,
            latencyMs,
            projectId: config.firebase.projectId,
            collections: collections.map(c => c.id),
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;

        return {
            ok: false,
            latencyMs,
            error: error.message,
            projectId: config.firebase.projectId,
        };
    }
};

// Alias para manter compatibilidade
const getFirestoreDb = getFirestore;
const healthcheckFirestore = healthCheckFirestore;

module.exports = {
    initializeFirebase,
    getFirestore,
    getFirestoreDb,
    healthCheckFirestore,
    healthcheckFirestore,
};
