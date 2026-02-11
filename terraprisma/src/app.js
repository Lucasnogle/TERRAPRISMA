require('dotenv').config();
require('./config/firebaseAdmin'); // Initialize Firebase Admin (Will exit if missing creds)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const router = require('./router');

const app = express();

// ──────────────────────────────────────────────
// 1. Body parser (with size limit to prevent DoS)
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ──────────────────────────────────────────────
// 2. Trust proxy (needed for rate limiter behind reverse proxy)
// ──────────────────────────────────────────────
if (config.server.environment === 'production') {
    app.set('trust proxy', config.server.trustProxyHops);
}

// ──────────────────────────────────────────────
// 3. Security headers (Helmet)
// ──────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow frontend on different port
}));

// ──────────────────────────────────────────────
// 4. HTTP request logging (Morgan)
//    dev: colored concise output | prod: Apache combined
// ──────────────────────────────────────────────
app.use(morgan(config.server.environment === 'production' ? 'combined' : 'dev'));

// ──────────────────────────────────────────────
// 5. CORS (restricted origins)
// ──────────────────────────────────────────────
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = config.cors.allowedOrigins;

        // Allow requests with no origin (server-to-server, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ──────────────────────────────────────────────
// 6. Static files
// ──────────────────────────────────────────────
app.use(express.static('public'));

// ──────────────────────────────────────────────
// 7. Routes
// ──────────────────────────────────────────────
app.use(router);

// ──────────────────────────────────────────────
// 8. 404 handler (unknown routes → JSON, not HTML)
// ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ──────────────────────────────────────────────
// 9. Global error handler (no stacktrace in prod)
// ──────────────────────────────────────────────
app.use((err, req, res, _next) => {
    // CORS errors come through here
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({ error: err.message });
    }

    console.error('[ErrorHandler]', err.message);

    const response = { error: 'Internal server error' };
    if (config.server.environment !== 'production') {
        response.stack = err.stack;
    }

    res.status(err.status || 500).json(response);
});

// ──────────────────────────────────────────────
// Production server start
// ──────────────────────────────────────────────
if (config.server.environment === 'production') {
    const http = require('http');
    const httpServer = http.createServer(app);
    httpServer.listen(config.server.port, () => {
        console.log(`Server running on port ${config.server.port}`);
    });
}

module.exports = app;
