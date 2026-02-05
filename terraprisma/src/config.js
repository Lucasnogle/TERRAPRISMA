require('dotenv').config();

module.exports = async () => {
    return {
        server: {
            port: process.env.PORT,
            environment: process.env.NODE_ENV,
        },
        auth: {
            jwtSecret: process.env.JWT_SECRET,
            jwtExpiresIn: process.env.JWT_EXPIRES_IN
        },
        firebase: {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        }
    };
};
