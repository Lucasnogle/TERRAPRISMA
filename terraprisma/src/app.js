const express = require('express');
const app = express();

// ──────────────────────────────────────────────
// Third-party Middleware
// ──────────────────────────────────────────────
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const router = require('./router');

// ──────────────────────────────────────────────
// Middleware Stack
// ──────────────────────────────────────────────
const requestContext = require('./middlewares/requestContextNodeMiddleware');
const errorHandler = require('./middlewares/errorHandlerExpressMiddleware');

// 1. Request Context (Correlation ID)
app.use(requestContext.middleware);

// 2. Security
app.use(helmet());
app.use(cors({ origin: config.cors.allowedOrigins, credentials: true }));

// 3. Body Parsing
app.use(express.json());

// 4. HTTP Logging
app.use(morgan('short'));

// 5. Routes
app.use('/', router);

// 6. Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
