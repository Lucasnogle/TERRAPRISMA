const express = require('express');
const router = express.Router();
const auth = require('./middlewares/auth');
const userController = require('./controllers/userController');
const automationController = require('./controllers/automationController');

// Auth
router.post('/authenticate', userController.authenticate);

// Automation Routes (Protected examples)
// router.use('/automation', auth); // Apply auth to all /automation routes if desired
router.patch('/automation/portOut', auth, automationController.portOut);

// Health Check
router.get('/health', (req, res) => res.send('OK'));

module.exports = router;
