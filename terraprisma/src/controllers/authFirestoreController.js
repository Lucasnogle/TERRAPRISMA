const authUsersDbModule = require('../modules/authUsersFirestoreModule');

const authController = {
    // Create User Document (Client must be auth'd with Firebase first)
    register: async (req, res) => {
        try {
            const { uid, email } = req.user;
            const { username } = req.body;

            if (!uid || !email) {
                return res.status(400).json({ error: 'Invalid token payload: missing uid or email' });
            }

            const existingUser = await authUsersDbModule.findUserById(uid);
            if (existingUser) {
                return res.status(409).json({ error: 'User already registered' });
            }

            const normalizedUsername = username ? username.trim() : email.split('@')[0];

            const userData = {
                username: normalizedUsername,
                email: email,
                role: 'user',
                advanced_permission: false,
                is_whitelisted: false,
                is_active: true
            };

            await authUsersDbModule.createUser(uid, userData);

            res.status(201).json({
                message: 'User registered successfully',
                userId: uid
            });

        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ error: 'Internal server error during registration' });
        }
    },

    // Whitelist User (Admin Only)
    whitelistUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_whitelisted } = req.body;

            const idNormalized = String(id).trim();

            if (typeof is_whitelisted !== 'boolean') {
                return res.status(400).json({ error: 'Invalid body. Expected { is_whitelisted: boolean }' });
            }

            const result = await authUsersDbModule.updateUserWhitelistStatus(idNormalized, is_whitelisted);

            if (!result) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                ok: true,
                id: result.uid,
                is_whitelisted: result.is_whitelisted
            });
        } catch (error) {
            console.error("Whitelist error:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get Current User (with Lazy Registration)
    me: async (req, res) => {
        try {
            const userId = req.userId;

            let user = await authUsersDbModule.findUserById(userId);

            if (!user) {
                // Auto-create user if they exist in Firebase Auth but not in Firestore
                console.log(`User ${userId} not found in Firestore. Auto-creating...`);

                const { email, uid } = req.user || {};
                const normalizedUsername = email ? email.split('@')[0] : `user_${uid.substring(0, 6)}`;

                const newUser = {
                    username: normalizedUsername,
                    email: email || '',
                    role: 'user',
                    advanced_permission: false,
                    is_whitelisted: false,
                    is_active: true
                };

                await authUsersDbModule.createUser(userId, newUser);
                user = await authUsersDbModule.findUserById(userId);
            }

            // Update stats
            await authUsersDbModule.updateUserLoginStats(userId);

            // Return safe user object (backward compatible: support both old and new field names)
            res.json({
                user: {
                    id: user.uid,
                    uid: user.uid,
                    username: user.username || user.username_auth_users || '',
                    email: user.email || user.email_auth_users || '',
                    role: user.role || user.role_auth_users || 'user',
                    is_whitelisted: user.is_whitelisted ?? user.is_whitelisted_auth_users ?? false,
                    advanced_permission: user.advanced_permission ?? user.advanced_permission_auth_users ?? false,
                    is_active: user.is_active ?? user.is_active_auth_users ?? true
                }
            });
        } catch (error) {
            console.error("Me error:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;
