const usersModel = require('../modules/userModule');
const jwt = require('jsonwebtoken');
const getConfig = require('../config');

const authenticate = async (req, res) => {
    const config = await getConfig();
    const { email, password } = req.body;

    try {
        const user = await usersModel.findUser(email, password);

        if (user) {
            const token = jwt.sign(
                { id: user.id, email: user.email },
                config.auth.jwtSecret,
                { expiresIn: config.auth.jwtExpiresIn }
            );
            return res.status(200).json({ token, user: { email: user.email, id: user.id } });
        }

        return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ message: 'Internal error' });
    }
};

module.exports = { authenticate };
