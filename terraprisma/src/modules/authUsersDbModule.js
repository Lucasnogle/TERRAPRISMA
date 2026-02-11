const { db, admin } = require('../config/firebaseAdmin');

const COLLECTION_USERS = 'AUTH_USERS';
const COLLECTION_COUNTERS = 'AUTH_COUNTERS';

const authUsersDbModule = {
    // Check if user exists by email or username
    // Returns user doc if found, otherwise null
    findUserByEmailOrUsername: async (email, username) => {
        try {
            // Check by email
            const emailQuery = await db.collection(COLLECTION_USERS)
                .where('email_auth_users', '==', email)
                .limit(1)
                .get();

            if (!emailQuery.empty) {
                return { exists: true, field: 'email', user: emailQuery.docs[0].data() };
            }

            // Check by username
            const usernameQuery = await db.collection(COLLECTION_USERS)
                .where('username_auth_users', '==', username)
                .limit(1)
                .get();

            if (!usernameQuery.empty) {
                return { exists: true, field: 'username', user: usernameQuery.docs[0].data() };
            }

            return { exists: false };
        } catch (error) {
            console.error("Error finding user:", error);
            throw error;
        }
    },

    createUser: async (userData) => {
        const counterRef = db.collection(COLLECTION_COUNTERS).doc('users');

        try {
            return await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);

                if (!counterDoc.exists) {
                    throw new Error("Counter document 'users' in 'AUTH_COUNTERS' does not exist!");
                }

                const nextId = counterDoc.data().next_id_auth_counters;
                const userId = String(nextId);

                const newUserRef = db.collection(COLLECTION_USERS).doc(userId);

                const timestamp = admin.firestore.FieldValue.serverTimestamp();

                const finalUser = {
                    id_auth_users: userId,
                    ...userData,
                    created_at_auth_users: timestamp,
                    updated_at_auth_users: timestamp,
                    last_login_at_auth_users: null
                };

                // Create user doc
                transaction.set(newUserRef, finalUser);

                // Increment counter
                transaction.update(counterRef, {
                    next_id_auth_counters: nextId + 1
                });

                return { userId, ...finalUser };
            });
        } catch (error) {
            console.error("Transaction failure:", error);
            throw error;
        }
    },

    findUserByLogin: async (login) => {
        try {
            // Try email first
            let userQuery = await db.collection(COLLECTION_USERS)
                .where('email_auth_users', '==', login)
                .limit(1)
                .get();

            if (userQuery.empty) {
                // Try username
                userQuery = await db.collection(COLLECTION_USERS)
                    .where('username_auth_users', '==', login)
                    .limit(1)
                    .get();
            }

            if (userQuery.empty) return null;

            return userQuery.docs[0].data();

        } catch (error) {
            console.error("Error finding user by login:", error);
            throw error;
        }
    },

    // [NEW] Find by ID
    findUserById: async (userId) => {
        try {
            const userDoc = await db.collection(COLLECTION_USERS).doc(userId).get();
            if (!userDoc.exists) return null;
            return userDoc.data();
        } catch (error) {
            console.error("Error finding user by ID:", error);
            throw error;
        }
    },

    // [NEW] Update Whitelist Status
    updateUserWhitelistStatus: async (userId, status) => {
        try {
            const userRef = db.collection(COLLECTION_USERS).doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return null; // User not found
            }

            await userRef.update({
                is_whitelisted_auth_users: status,
                updated_at_auth_users: admin.firestore.FieldValue.serverTimestamp()
            });

            return { id_auth_users: userId, is_whitelisted_auth_users: status };
        } catch (error) {
            console.error("Error updating whitelist:", error);
            throw error;
        }
    },

    updateUserLoginStats: async (userId) => {
        try {
            const userRef = db.collection(COLLECTION_USERS).doc(userId);
            const timestamp = admin.firestore.FieldValue.serverTimestamp();

            await userRef.update({
                last_login_at_auth_users: timestamp,
                updated_at_auth_users: timestamp
            });
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    }
};

module.exports = authUsersDbModule;
