const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Path to service account key
const serviceAccountPath = path.resolve(process.cwd(), 'secrets', 'serviceAccountKey.json');

let db;

console.log(`[Firebase] Initializing...`);

try {
    if (fs.existsSync(serviceAccountPath)) {
        // Strategy 1: Service Account JSON File
        console.log(`[Firebase] Found service account at: ${serviceAccountPath}`);
        const serviceAccount = require(serviceAccountPath);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`[Firebase] Initialized with JSON for project: ${serviceAccount.project_id}`);
        }
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        // Strategy 2: Environment Variables (Fallback)
        console.log(`[Firebase] Service account JSON not found. Attempting to use Environment Variables...`);

        // Handle private key newlines
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            console.log(`[Firebase] Initialized with ENV VARS for project: ${process.env.FIREBASE_PROJECT_ID}`);
        }
    } else {
        // Strategy 3: Application Default Credentials (ADC) or Fail
        console.warn(`[Firebase] Service Account JSON missing AND Emv Vars missing/incomplete.`);
        console.warn(`[Firebase] Attempting to use Application Default Credentials (ADC)...`);

        if (!admin.apps.length) {
            admin.initializeApp(); // Tries ADC
            console.log(`[Firebase] Initialized with ADC.`);
        }
    }

    db = admin.firestore();

} catch (error) {
    console.error("\n==================================================================================");
    console.error("[Firebase] CRITICAL ERROR: Initialization Failed.");
    console.error(error);
    console.error("==================================================================================\n");
    process.exit(1);
}

module.exports = { admin, db };
