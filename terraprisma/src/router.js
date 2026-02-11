const express = require('express');
const router = express.Router();
const auth = require('./middlewares/auth');
const requireAdmin = require('./middlewares/requireAdmin');
const authLimiter = require('./middlewares/rateLimiter');
const authController = require('./controllers/authController');
const automationController = require('./controllers/automationController');
const { registerValidator, authenticateValidator, handleValidationErrors } = require('./validators/authValidators');

// Auth
router.post('/authenticate', authenticateValidator, handleValidationErrors, authLimiter, authController.authenticate);
router.post('/register', registerValidator, handleValidationErrors, authController.register);
router.get('/me', auth, (req, res) => {
    res.json({ ok: true, userId: req.userId, user: req.user });
});

// Admin Routes
router.patch('/admin/users/:id/whitelist', auth, requireAdmin, authController.whitelistUser);

// Automation Routes (Protected)
router.patch('/automation/portOut', auth, automationController.portOut);

// Health Check (JSON, no sensitive data)
router.get('/health', (req, res) => {
    res.json({
        ok: true,
        env: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()) + 's'
    });
});

module.exports = router;
