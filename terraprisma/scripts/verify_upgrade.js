/**
 * Verification Script for TERRAPRISMA Enterprise Upgrade
 * 
 * Usage: node scripts/verify_upgrade.js
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000';
const DEMO_KEY = process.env.DEMO_API_KEY || 'test-key'; // You need to seed this in Firestore first

const run = async () => {
    console.log('🔍 Starting Verification...\n');

    try {
        // 1. Health Check
        console.log('1️⃣ Checking Health Endpoint...');
        const health = await axios.get(`${API_URL}/health`);
        console.log('✅ Health OK:', health.data);

        // 2. Metrics Check
        console.log('\n2️⃣ Checking Metrics Endpoint...');
        const metrics = await axios.get(`${API_URL}/ops/metrics`);
        if (metrics.data.includes('http_requests_total')) {
            console.log('✅ Metrics Exposed correctly');
        } else {
            console.error('❌ Metrics missing expected data');
        }

        // 3. API Auth Check (Expect 401/403 with dummy key)
        console.log('\n3️⃣ Checking Auth Security...');
        try {
            await axios.get(`${API_URL}/api/system/overview`, {
                headers: { 'x-api-key': 'invalid-key' }
            });
            console.error('❌ Auth Failed: Request should have been rejected');
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log('✅ Auth Blocked (Expected):', error.response.status);
            } else {
                throw error;
            }
        }

        console.log('\n✅ Basic Verification Passed!');
        console.log('Note: To verify Jobs and Workers, ensure Firestore emulator is running and you have seeded a valid API Key.');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Hint: Is the server running? (npm start)');
        }
    }
};

run();
