require('dotenv').config();

const config = {
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development',
    },
    cors: {
        allowedOrigins: parseCorsOrigins(
            process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000',
            process.env.NODE_ENV || 'development'
        )
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }
};

/**
 * Parse and validate CORS_ALLOWED_ORIGINS.
 */
function parseCorsOrigins(raw, env) {
    return raw
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
        .reduce((acc, origin) => {
            const hasScheme = origin.startsWith('http://') || origin.startsWith('https://');

            if (hasScheme) {
                acc.push(origin);
            } else if (env !== 'production') {
                const fixed = `http://${origin}`;
                console.warn(`[CORS] WARN: origin "${origin}" missing scheme, auto-corrected to "${fixed}" (dev only)`);
                acc.push(fixed);
            } else {
                console.warn(`[CORS] WARN: origin "${origin}" missing scheme (http/https), IGNORED in production`);
            }

            return acc;
        }, []);
}

module.exports = config;
