const admin = require('firebase-admin');
const config = require('../config');
const path = require('path');
const fs = require('fs');

let db = null;

const initialize = async () => {
    if (db) return db;

    try {
        const conf = config; // config is a plain object (synchronous)

        // Define the path to the service account file
        const serviceAccountPath = path.resolve(__dirname, '../../terraprisma-dbo-firebase-adminsdk-fbsvc-376852043f.json');

        if (!admin.apps.length) {
            if (conf.firebase.clientEmail && conf.firebase.privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: conf.firebase.projectId,
                        clientEmail: conf.firebase.clientEmail,
                        privateKey: conf.firebase.privateKey
                    }),
                    projectId: conf.firebase.projectId
                });
                console.log('Initialized Firebase with Environment Variables');
            } else if (fs.existsSync(serviceAccountPath)) {
                // Use the service account file if it exists
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: conf.firebase.projectId || serviceAccount.project_id
                });
                console.log(`Initialized Firebase with Service Account: ${path.basename(serviceAccountPath)}`);
            } else {
                // Fallback to Application Default Credentials
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: conf.firebase.projectId
                });
                console.log('Initialized Firebase with ADC');
            }
        }

        db = admin.firestore();
        console.log('Connected to Firebase Firestore');
        return db;
    } catch (error) {
        console.error('Error connecting to Firebase:', error);
        throw error;
    }
};

const getDb = async () => {
    if (!db) {
        await initialize();
    }
    return db;
};

module.exports = {
    initialize,
    getDb,
    admin
};
