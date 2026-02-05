const request = require('supertest');
const app = require('../src/app');

// Mock Firebase Admin to avoid needing real credentials in tests
jest.mock('firebase-admin', () => ({
    credential: {
        cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    firestore: () => ({
        collection: () => ({
            doc: () => ({
                get: jest.fn().mockResolvedValue({ exists: false }),
                set: jest.fn(),
            }),
            listCollections: jest.fn().mockResolvedValue([]),
        }),
        listCollections: jest.fn().mockResolvedValue([]),
    }),
}));

// Mock logger to avoid cluttering test output
jest.mock('../src/utils/logger', () => ({
    loggers: {
        api: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        worker: { info: jest.fn(), error: jest.fn() },
        cron: { info: jest.fn(), error: jest.fn() },
        firestore: { info: jest.fn(), error: jest.fn() },
    },
    requestIdMiddleware: (req, res, next) => next(),
    requestLogMiddleware: (req, res, next) => next(),
}));

describe('API Endpoints', () => {
    it('GET /status should return 200 OK', async () => {
        const res = await request(app).get('/status');
        expect(res.statusCode).toEqual(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.data.status).toBe('ok');
    });

    it('GET /api/tenant without key should return 401', async () => {
        const res = await request(app).get('/api/tenant');
        expect(res.statusCode).toEqual(401);
        expect(res.body.ok).toBe(false);
    });

    // Nota: Testes mais complexos requerem mockar o middleware de auth e conexão com banco
    // Este é um setup básico para CI/CD
});
