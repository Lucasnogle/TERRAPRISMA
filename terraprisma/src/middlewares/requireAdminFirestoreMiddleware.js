const authUsersDbModule = require('../modules/authUsersFirestoreModule');

module.exports = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Access denied. User not authenticated.' });
        }

        // [UPDATED] Check DB for admin role
        // Firebase ID Tokens don't have custom claims by default unless synced.
        // We rely on the DB check below for security.

        // [HARDENING] Strict Verification: Always check DB if token claims admin
        // This ensures revoked admins are blocked immediately
        const user = await authUsersDbModule.findUserById(req.userId);

        if (!user || user.role !== 'admin') {
            console.warn(`[Security] Admin access denied for user ${req.userId}. Token claimed admin but DB disagreed.`);
            return res.status(403).json({ error: 'Access denied. Privileges revoked.' });
        }

        next();
    } catch (error) {
        console.error("RequireAdmin Error:", error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};
