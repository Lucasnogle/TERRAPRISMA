const jwt = require('jsonwebtoken');
const getConfig = require('../config');

const auth = async (req, res, next) => {
    const config = await getConfig();
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const tokenVerify = token.split(' ')[1];

    jwt.verify(tokenVerify, config.auth.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido.' });
        }

        if (decoded.exp < Date.now() / 1000) {
            const newToken = jwt.sign(
                { id: decoded.id, email: decoded.email, company_id: decoded.company_id },
                config.auth.jwtSecret,
                { expiresIn: config.auth.jwtExpiresIn }
            );
            res.setHeader('Authorization', `Bearer ${newToken}`);
        }

        req.userId = decoded.id;
        next();
    });
};

module.exports = auth;
