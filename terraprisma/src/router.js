const express = require('express');
const router = express.Router();

// Middlewares
const auth = require('./middlewares/authFirebaseMiddleware');

// Controllers
const authController = require('./controllers/authFirestoreController');

// ─── Auth Routes (Firebase Token) ────────────────
router.post('/register', auth, authController.register);
router.get('/me', auth, authController.me);

// ─── Health Check ────────────────────────────────
router.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = router;
