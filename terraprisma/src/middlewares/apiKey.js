const crypto = require('crypto');
const { getFirestore } = require('../modules/connectionFirestore');

/**
 * Gera hash SHA256 da API key
 * @param {string} apiKey
 * @returns {string}
 */
const hashApiKey = (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Middleware de autenticação via API Key com suporte multi-tenant
 * 
 * Fluxo:
 * 1. Lê header x-api-key
 * 2. Gera hash da key
 * 3. Busca em api_keys/{hash}
 * 4. Valida que não está revogada
 * 5. Carrega tenant de tenants/{tenantId}
 * 6. Popula req.tenant
 */
const apiKey = async (req, res, next) => {
    const key = req.headers['x-api-key'];

    if (!key) {
        return res.status(401).json({
            ok: false,
            error: { code: 'UNAUTHORIZED', message: 'x-api-key header required' },
        });
    }

    try {
        // [DEV] Bypass para desenvolvimento local
        if (process.env.NODE_ENV === 'development' && process.env.API_KEY && key === process.env.API_KEY) {
            console.log('[API] Usando chave de desenvolvimento do .env');

            req.tenant = {
                id: 'dev_tenant_id',
                name: 'Tenant de Desenvolvimento',
                email: 'dev@terraprisma.com',
            };

            req.apiKey = {
                hash: 'dev_hash',
                name: 'Dev Key',
            };

            return next();
        }

        const db = getFirestore();
        const keyHash = hashApiKey(key);

        // Buscar API key
        const apiKeyDoc = await db.collection('api_keys').doc(keyHash).get();

        if (!apiKeyDoc.exists) {
            return res.status(401).json({
                ok: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
            });
        }

        const apiKeyData = apiKeyDoc.data();

        // Verificar se está revogada
        if (apiKeyData.revokedAt) {
            return res.status(401).json({
                ok: false,
                error: { code: 'UNAUTHORIZED', message: 'API key has been revoked' },
            });
        }

        // Carregar tenant
        const tenantDoc = await db.collection('tenants').doc(apiKeyData.tenantId).get();

        if (!tenantDoc.exists) {
            return res.status(401).json({
                ok: false,
                error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
            });
        }

        const tenantData = tenantDoc.data();

        // Popula req.tenant
        req.tenant = {
            id: tenantDoc.id,
            name: tenantData.name,
            email: tenantData.email,
        };

        req.apiKey = {
            hash: keyHash,
            name: apiKeyData.name,
        };

        next();
    } catch (error) {
        console.error('[API] apiKey middleware error:', error.message);
        return res.status(500).json({
            ok: false,
            error: { code: 'INTERNAL_ERROR', message: 'Authentication error' },
        });
    }
};

module.exports = apiKey;
module.exports.hashApiKey = hashApiKey;
