require('dotenv').config();
const cron = require('node-cron');
const { initialize } = require('./modules/connectionFirebase');
const config = require('./config');

// Initialize Firebase for cron jobs if needed
initialize().then(() => {
    console.log('Firebase initialized for Cron');
}).catch(err => console.error('Firebase init failed for Cron', err));

// Example Task: Heartbeat or checks
cron.schedule('*/5 * * * *', () => {
    console.log('Running periodic tasks...');
    // Add logic here
}, {
    timezone: "America/Sao_Paulo"
});

console.log('Cron jobs started');
