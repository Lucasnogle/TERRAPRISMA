const { admin } = require('../config/firebaseAdmin');

module.exports = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.userId = decodedToken.uid;
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        return res.status(403).json({ error: 'Access forbidden. Invalid token.' });
    }
};
