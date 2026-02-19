const { db, admin } = require('../config/firebaseAdmin');

const COLLECTION_USERS = 'users';

const authUsersDbModule = {
    // Check if user exists by ID (UID)
    findUserById: async (uid) => {
        try {
            const userDoc = await db.collection(COLLECTION_USERS).doc(uid).get();
            if (!userDoc.exists) return null;
            return userDoc.data();
        } catch (error) {
            console.error("Error finding user by ID:", error);
            throw error;
        }
    },

    // Create User with Firebase UID
    createUser: async (uid, userData) => {
        try {
            const userRef = db.collection(COLLECTION_USERS).doc(uid);

            // Check if already exists to avoid overwrite (optional safeguards)
            const doc = await userRef.get();
            if (doc.exists) {
                throw new Error("User already exists with this UID");
            }

            const timestamp = admin.firestore.FieldValue.serverTimestamp();

            const finalUser = {
                uid: uid, // Store UID explicitly if needed, though known by doc ID
                ...userData,
                created_at: timestamp,
                updated_at: timestamp,
                last_login_at: timestamp // Set initial login
            };

            await userRef.set(finalUser);

            return finalUser;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    // Update User Login Stats
    updateUserLoginStats: async (uid) => {
        try {
            const userRef = db.collection(COLLECTION_USERS).doc(uid);
            const timestamp = admin.firestore.FieldValue.serverTimestamp();

            await userRef.update({
                last_login_at: timestamp,
                updated_at: timestamp
            });
        } catch (error) {
            console.error("Error updating stats:", error);
            // Don't throw, stats are non-critical
        }
    },

    // [NEW] Update Whitelist Status
    updateUserWhitelistStatus: async (uid, status) => {
        try {
            const userRef = db.collection(COLLECTION_USERS).doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return null;
            }

            await userRef.update({
                is_whitelisted: status,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });

            return { uid: uid, is_whitelisted: status };
        } catch (error) {
            console.error("Error updating whitelist:", error);
            throw error;
        }
    }
};

module.exports = authUsersDbModule;

