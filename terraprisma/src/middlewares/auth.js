const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const secret = config.auth.jwtSecret;
        if (!secret) throw new Error("JWT_SECRET missing in config");

        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id_auth_users;
        req.user = decoded; // Optional: attach full payload
        next();
    } catch (error) {
        // [HARDENING] Specific error handling for JWT
        if (error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError' ||
            error.name === 'NotBeforeError') {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        console.error("Auth Middleware Error:", error.message);
        return res.status(403).json({ error: 'Access forbidden.' });
    }
};
