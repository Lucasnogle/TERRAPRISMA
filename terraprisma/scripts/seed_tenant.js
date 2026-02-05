/**
 * Script para criar tenant de teste
 * 
 * Uso: node scripts/seed_tenant.js
 * 
 * Saída: tenantId e apiKey (salve a apiKey, ela só aparece uma vez!)
 */

require('dotenv').config();
const { initializeFirebase } = require('../src/modules/connectionFirestore');
const tenantService = require('../src/services/tenantService');

const seedTenant = async () => {
    console.log('[SEED] Inicializando Firebase...');
    initializeFirebase();

    console.log('[SEED] Criando tenant de teste...');

    const tenant = await tenantService.createTenant({
        name: 'Usuário Teste',
        email: 'teste@segundaleve.com',
        plan: 'pro',
        planPreferences: {
            dayOfWeek: 0,
            hour: 18,
            timezone: 'America/Sao_Paulo',
        },
    });

    console.log('\n========================================');
    console.log('TENANT CRIADO COM SUCESSO!');
    console.log('========================================');
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Email: ${tenant.email}`);
    console.log(`Plano: ${tenant.plan}`);
    console.log('----------------------------------------');
    console.log('⚠️  SALVE A API KEY ABAIXO (só aparece uma vez):');
    console.log('----------------------------------------');
    console.log(`API Key: ${tenant.apiKey}`);
    console.log('========================================\n');

    console.log('Para testar, use:');
    console.log(`$headers = @{ "x-api-key" = "${tenant.apiKey}" }`);
    console.log('Invoke-RestMethod -Uri "http://localhost:3000/api/tenant" -Headers $headers\n');

    process.exit(0);
};

seedTenant().catch(err => {
    console.error('[SEED] Erro:', err.message);
    process.exit(1);
});
