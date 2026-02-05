require('dotenv').config();
const { initialize } = require('./modules/connectionFirebase');
const jobService = require('./services/jobService');

const POLL_INTERVAL = 2000;
let isRunning = true;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Example job handler
const handleTest = async (job) => {
    await sleep(500);
    return { ok: true, echo: job.payload, processedAt: new Date().toISOString() };
};

const processJob = async (job) => {
    console.log(`Processing job ${job.id}`, { type: job.type });
    switch (job.type) {
        case 'test':
            return handleTest(job);
        default:
            throw new Error(`Unknown job type: ${job.type}`);
    }
};

const runWorker = async () => {
    console.log('Worker starting...');
    try {
        await initialize();
    } catch (error) {
        console.error('Failed to initialize Firebase', error);
        process.exit(1);
    }
    console.log('Waiting for jobs...');

    while (isRunning) {
        try {
            const job = await jobService.claimNextJob();
            if (!job) {
                await sleep(POLL_INTERVAL);
                continue;
            }

            console.log(`[WORKER] Job claimed: ${job.id}`);
            try {
                const result = await processJob(job);
                await jobService.completeJob(job.id, result);
                console.log(`Job completed: ${job.id}`);
            } catch (processError) {
                await jobService.failJob(job.id, processError);
                console.error(`Job failed: ${job.id}`, processError);
            }
        } catch (error) {
            console.error('Loop error', error);
            await sleep(POLL_INTERVAL);
        }
    }
    console.log('Worker stopped.');
};

runWorker().catch(err => {
    console.error('Fatal error', err);
    process.exit(1);
});
