/**
 * TERRAPRISMA Worker
 * Processa jobs da fila do Firestore
 */

require('dotenv').config();
const { initializeFirebase } = require('./modules/connectionFirestore');
const jobService = require('./services/jobService');
const { loggers } = require('./utils/logger');

// Intervalo de polling (ms)
const POLL_INTERVAL = 2000;

// Flag para graceful shutdown
let isRunning = true;

/**
 * Simula processamento (sleep)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// Job Handlers
// ============================================

/**
 * Handler: test
 * Job de teste básico
 */
const handleTest = async (job) => {
    await sleep(500);
    return { ok: true, echo: job.payload, processedAt: new Date().toISOString() };
};

// ============================================
// Dispatcher
// ============================================

/**
 * Processa um job baseado no type
 */
const processJob = async (job) => {
    loggers.worker.info(`Processing job ${job.id}`, { type: job.type });

    switch (job.type) {
        case 'test':
            return handleTest(job);

        default:
            throw new Error(`Unknown job type: ${job.type}`);
    }
};

// ============================================
// Main Loop
// ============================================

/**
 * Loop principal do worker
 */
const runWorker = async () => {
    loggers.worker.info('Worker starting...');

    // Inicializa Firebase
    try {
        initializeFirebase();
    } catch (error) {
        loggers.worker.error('Failed to initialize Firebase', { error: error.message });
        process.exit(1);
    }

    loggers.worker.info('Waiting for jobs...');

    while (isRunning) {
        try {
            // Tenta pegar o próximo job
            const job = await jobService.claimNextJob();

            if (!job) {
                // Sem jobs, aguarda antes de tentar novamente
                await sleep(POLL_INTERVAL);
                continue;
            }

            console.log(`[WORKER] Job claimed: ${job.id}`);

            try {
                // Processa o job
                const result = await processJob(job);

                // Marca como sucesso
                await jobService.completeJob(job.id, result);
                loggers.worker.info(`Job completed: ${job.id}`);
            } catch (processError) {
                // Marca como erro
                await jobService.failJob(job.id, processError);
                loggers.worker.error(`Job failed: ${job.id}`, { error: processError.message });
            }
        } catch (error) {
            loggers.worker.error('Loop error', { error: error.message });
            await sleep(POLL_INTERVAL);
        }
    }

    loggers.worker.info('Worker stopped.');
};

// Graceful shutdown
process.on('SIGINT', () => {
    loggers.worker.info('SIGINT received, shutting down...');
    isRunning = false;
});

process.on('SIGTERM', () => {
    loggers.worker.info('SIGTERM received, shutting down...');
    isRunning = false;
});

// Inicia o worker
runWorker().catch(err => {
    loggers.worker.error('Fatal error', { error: err.message });
    process.exit(1);
});
