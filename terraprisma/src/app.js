const express = require('express');
const cors = require('cors');
const router = require('./router');
const { errorHandler } = require('./middlewares/errorHandler');
const { requestIdMiddleware, requestLogMiddleware } = require('./utils/logger');

const app = express();

// Trust proxy (para rate limit funcionar corretamente atrás de load balancer)
app.set('trust proxy', 1);

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request tracking (requestId + logging)
app.use(requestIdMiddleware);
app.use(requestLogMiddleware);

// Rotas
app.use('/', router);

// Error handler (deve ser o último)
app.use(errorHandler);

module.exports = app;
