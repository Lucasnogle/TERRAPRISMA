const authUsersDbModule = require('../modules/authUsersDbModule');

module.exports = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Access denied. User not authenticated.' });
        }

        const tokenRole = req.user && req.user.role_auth_users;

        // [HARDENING] Immediate rejection if token claims non-admin
        if (tokenRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        // [HARDENING] Strict Verification: Always check DB if token claims admin
        // This ensures revoked admins are blocked immediately
        const user = await authUsersDbModule.findUserById(req.userId);

        if (!user || user.role_auth_users !== 'admin') {
            console.warn(`[Security] Admin access denied for user ${req.userId}. Token claimed admin but DB disagreed.`);
            return res.status(403).json({ error: 'Access denied. Privileges revoked.' });
        }

        next();
    } catch (error) {
        console.error("RequireAdmin Error:", error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};
