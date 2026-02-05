require('dotenv').config();
const cron = require('node-cron');
const { initializeFirebase } = require('./modules/connectionFirestore');
const { updateHeartbeat } = require('./services/firestoreService');
const jobService = require('./services/jobService');
const config = require('./config');
const { loggers } = require('./utils/logger');

// Inicializa Firebase para o cron
initializeFirebase();

// ============================================
// Heartbeat - a cada 5 minutos
// ============================================
cron.schedule('*/5 * * * *', async () => {
    try {
        await updateHeartbeat();
        loggers.cron.debug('Heartbeat updated');
    } catch (error) {
        loggers.cron.error('Heartbeat error', { error: error.message });
    }
}, {
    scheduled: true,
    timezone: config.timezone
});

// ============================================
// Recuperação de Jobs Travados - a cada 5 minutos
// ============================================
cron.schedule('*/5 * * * *', async () => {
    loggers.cron.debug('Checking for stuck jobs...');

    try {
        const result = await jobService.recoverStuckJobs();

        if (result.recovered > 0 || result.movedToFinal > 0) {
            loggers.cron.info('Stuck jobs processed', { recovered: result.recovered, dlq: result.movedToFinal });
        }
    } catch (error) {
        loggers.cron.error('Error recovering stuck jobs', { error: error.message });
    }
}, {
    scheduled: true,
    timezone: config.timezone
});

// ============================================
// Startup Log
// ============================================
loggers.cron.info(`Cron jobs started (timezone: ${config.timezone})`);
loggers.cron.info('Schedules loaded: Heartbeat (5m), Stuck Recovery (5m)');
loggers.cron.info('Job settings', { maxAttempts: config.job.maxAttempts, timeout: config.job.runningTimeoutMinutes });
