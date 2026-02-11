const bcrypt = require('bcrypt'); // or bcryptjs if installed
const jwt = require('jsonwebtoken');
const authUsersDbModule = require('../modules/authUsersDbModule');
const config = require('../config');

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // Basic validation (defense-in-depth, validators already check)
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields: username, email, password' });
            }

            // [HARDENING] Normalize inputs to prevent case-based duplicate bypass
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedUsername = username.trim();

            // Check for duplicates (using normalized values)
            const existing = await authUsersDbModule.findUserByEmailOrUsername(normalizedEmail, normalizedUsername);
            if (existing.exists) {
                return res.status(409).json({ error: 'User already exists' });
            }

            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Prepare user data
            const userData = {
                username_auth_users: normalizedUsername,
                email_auth_users: normalizedEmail,
                password_hash_auth_users: passwordHash,
                role_auth_users: 'user',
                advanced_permission_auth_users: false,
                is_whitelisted_auth_users: false, // Default to false
                is_active_auth_users: true
            };

            // Create user (transaction handles ID generation)
            const newUser = await authUsersDbModule.createUser(userData);

            res.status(201).json({
                message: 'User registered successfully',
                userId: newUser.id_auth_users
            });

        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ error: 'Internal server error during registration' });
        }
    },

    authenticate: async (req, res) => {
        try {
            const { login, password } = req.body;

            if (!login || !password) {
                return res.status(400).json({ error: 'Missing login or password' });
            }

            // Find user
            // login can be email or username
            const user = await authUsersDbModule.findUserByLogin(login);

            if (!user) {
                // User not found (-4)
                return res.status(404).json({ tipoErro: -4, message: 'User not found' });
            }

            // Check if active (-2)
            if (!user.is_active_auth_users) {
                return res.status(403).json({ tipoErro: -2, message: 'User is blocked' });
            }

            // Check Whitelist (-3)
            if (!user.is_whitelisted_auth_users) {
                return res.status(401).json({ tipoErro: -3, message: 'User not whitelisted' });
            }

            // Verify password (-1)
            const match = await bcrypt.compare(password, user.password_hash_auth_users);
            if (!match) {
                return res.status(401).json({ tipoErro: -1, message: 'Invalid password' });
            }

            // Generate Token
            const tokenPayload = {
                id_auth_users: user.id_auth_users,
                email_auth_users: user.email_auth_users,
                role_auth_users: user.role_auth_users
            };

            // USE CONFIG
            const secret = config.auth.jwtSecret;
            // [HARDENING] Robust fallback for expiresIn
            const expiresIn = config.auth.jwtExpiresIn || '1d';

            if (!secret) {
                throw new Error("JWT_SECRET is not defined in configuration");
            }

            const token = jwt.sign(tokenPayload, secret, { expiresIn: expiresIn });

            // Update stats
            await authUsersDbModule.updateUserLoginStats(user.id_auth_users);

            // Respond
            res.status(200).json({
                token,
                user: {
                    id_auth_users: user.id_auth_users,
                    username_auth_users: user.username_auth_users,
                    email_auth_users: user.email_auth_users,
                    role_auth_users: user.role_auth_users,
                    is_whitelisted_auth_users: user.is_whitelisted_auth_users,
                    advanced_permission_auth_users: user.advanced_permission_auth_users
                }
            });

        } catch (error) {
            console.error("Authentication error:", error);
            res.status(500).json({ error: 'Internal server error during authentication' });
        }
    },

    // [NEW] Whitelist User (Admin Only)
    whitelistUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_whitelisted } = req.body;

            // [HARDENING] Normalize ID
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
                id_auth_users: result.id_auth_users,
                is_whitelisted_auth_users: result.is_whitelisted_auth_users
            });
        } catch (error) {
            console.error("Whitelist error:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;
