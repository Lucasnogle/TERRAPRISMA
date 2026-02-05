const express = require('express');
const router = express.Router();
const apiKey = require('./middlewares/apiKey');
const { apiGetLimiter, apiPostLimiter, apiSensitiveLimiter } = require('./middlewares/rateLimit');
const { healthCheckFirestore } = require('./modules/connectionFirestore');
const jobService = require('./services/jobService');

// Controllers
const jobController = require('./controllers/jobController');
const tenantController = require('./controllers/tenantController');
// ============================================
// Rotas públicas (sem autenticação)
// ============================================

// Health check básico
router.get('/status', (req, res) => {
    res.json({
        ok: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'terraprisma',
        },
    });
});

// Health check completo com Firestore
router.get('/ops/health', async (req, res) => {
    try {
        const firestoreHealth = await healthCheckFirestore();

        const response = {
            ok: firestoreHealth.ok,
            data: {
                status: firestoreHealth.ok ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                firestore: firestoreHealth,
            },
        };

        const statusCode = firestoreHealth.ok ? 200 : 503;
        res.status(statusCode).json(response);
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: {
                code: 'HEALTH_CHECK_FAILED',
                message: error.message,
            },
        });
    }
});

// Métricas de Jobs (para observabilidade)
router.get('/ops/metrics', async (req, res) => {
    try {
        const metrics = await jobService.getJobMetrics();

        res.json({
            ok: true,
            data: {
                jobs: {
                    total: metrics.total,
                    queued: metrics.byStatus.queued,
                    running: metrics.byStatus.running,
                    successLast24h: metrics.last24h.success,
                    errorLast24h: metrics.last24h.error,
                    errorFinalLast24h: metrics.last24h.error_final,
                },
                timestamp: metrics.timestamp,
            },
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: {
                code: 'METRICS_FAILED',
                message: error.message,
            },
        });
    }
});

// ============================================
// Rotas API (protegidas por x-api-key + rate limit)
// ============================================

// Tenant (GET = light limit)
router.get('/api/tenant', apiKey, apiGetLimiter, tenantController.getTenant);

// Jobs (genérico, filtrado por tenant)
router.post('/api/jobs', apiKey, apiPostLimiter, jobController.create);
router.get('/api/jobs', apiKey, apiGetLimiter, jobController.list);
router.get('/api/jobs/:id', apiKey, apiGetLimiter, jobController.get);
router.post('/api/jobs/:id/retry', apiKey, apiSensitiveLimiter, jobController.retry);
router.post('/api/jobs/:id/cancel', apiKey, apiSensitiveLimiter, jobController.cancel);

module.exports = router;
