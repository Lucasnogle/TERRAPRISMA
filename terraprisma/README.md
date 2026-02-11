# SEGUNDA LEVE (TERRAPRISMA Backend)

Plataforma SaaS para gestão de ansiedade semanal ("Sunday Scaries"), ajudando profissionais a priorizarem tarefas e organizarem sua semana.

## Visão do Produto

O **Segunda Leve** combate a ansiedade de domingo através de:
1. **Priorização Inteligente**: Definição guiada de 3 prioridades semanais.
2. **Contexto via IA**: Análise de contexto do usuário para sugestões personalizadas.
3. **Notificações Ativas**: Entrega do plano via email no domingo à noite.

---

Backend Node.js/Express com Firestore, Worker Jobs e Cron.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** Firebase Firestore
- **Queue:** Firestore-based job queue
- **Process Manager:** PM2

## Setup

```bash
# Instalar dependências
npm install

# Copiar .env
cp .env_example .env
# Editar .env com suas credenciais

# Configurar Firebase (OBRIGATÓRIO)
# 1. Acesse Firebase Console > Project Settings > Service accounts
# 2. Clique em "Generate new private key"
# 3. Salve o arquivo como: secrets/serviceAccountKey.json

# Desenvolvimento
npm run dev

# Worker (em outro terminal)
node src/worker.js

# Cron (em outro terminal)
node src/cron.js

# Produção (PM2)
pm2 start ecosystem.config.js
```

## Estrutura

```
src/
├── app.js              # Express app setup
├── server.js           # HTTP server
├── router.js           # Route definitions
├── config.js           # Environment config
├── worker.js           # Job processor
├── cron.js             # Scheduled tasks
├── controllers/        # Route handlers
├── services/           # Business logic
├── middlewares/        # Express middlewares
├── modules/            # Database connections
├── validators/         # Zod schemas
├── templates/          # Email templates
└── utils/              # Utilities (logger, etc)
```

## Rotas Públicas

| Method | Path | Descrição |
|--------|------|-----------|
| GET | `/status` | Health check básico |
| GET | `/ops/health` | Health check + Firestore |
| GET | `/ops/metrics` | Métricas de jobs |

## Rotas API (requer `x-api-key` header)

| Method | Path | Descrição |
|--------|------|-----------|
| GET | `/api/tenant` | Dados do tenant |
| PUT | `/api/tenant/preferences` | Atualizar preferências |
| POST | `/api/segundaleve/plan` | Solicitar plano semanal |
| GET | `/api/segundaleve/plans` | Listar planos |
| GET | `/api/segundaleve/plan/:id` | Detalhar plano |
| POST | `/api/segundaleve/plan/:id/priority/:pid/complete` | Completar prioridade |
| POST | `/api/jobs` | Criar job |
| GET | `/api/jobs` | Listar jobs |
| GET | `/api/jobs/:id` | Detalhar job |
| POST | `/api/jobs/:id/retry` | Retry job com erro |
| POST | `/api/jobs/:id/cancel` | Cancelar job |

## Rate Limiting

- **GET /api/***: 120 req/min por IP+tenant
- **POST /api/***: 30 req/min por IP+tenant
- **Operações sensíveis (retry/cancel)**: 10 req/min

Em produção, substituir MemoryStore por Redis:

```javascript
const RedisStore = require('rate-limit-redis');
const redisClient = require('./redis');
store: new RedisStore({ client: redisClient })
```

## Job Status

| Status | Descrição |
|--------|-----------|
| `queued` | Aguardando processamento |
| `running` | Em processamento |
| `success` | Concluído com sucesso |
| `error` | Erro (pode ser retried) |
| `error_final` | Dead Letter Queue (max attempts) |
| `cancelled` | Cancelado manualmente |

## Tipos de Job

| Type | Descrição |
|------|-----------|
| `plan.generate` | Gera plano semanal com IA |
| `notify.email` | Envia email com plano |
| `plan.complete_priority` | Marca prioridade como feita |
| `cron.weekly_plans` | Dispara planos para todos tenants |
| `test` | Job de teste (echo payload) |

## Cron Jobs

> **Nota:** Em produção no Cloud Run, use o [Cloud Scheduler](https://cloud.google.com/scheduler) para invocar endpoints protegidos em vez de rodar um processo cron contínuo.

| Schedule | Descrição |
|----------|-----------|
| `*/5 * * * *` | Heartbeat (atualiza ops/heartbeat) |
| `*/5 * * * *` | Recuperação de jobs travados |
| `0 18 * * 0` | Planos semanais (Domingo 18h) |

---

## Deploy no Cloud Run

### 1. Preparação
O sistema detecta automaticamente se está rodando no Google Cloud e usa **Application Default Credentials (ADC)**. Não é necessário montar arquivo de service account JSON.

### 2. Variáveis e Segredos
Use o **Secret Manager** para dados sensíveis. Mapeie os segredos como variáveis de ambiente no Cloud Run:

- `OPENAI_API_KEY` (Secret)
- `SMTP_PASS` (Secret)
- `JWT_SECRET` (Secret)
- `FIREBASE_PROJECT_ID` (Env Var)

### 3. Build & Deploy

```bash
# Build
gcloud builds submit --tag gcr.io/SEU_PROJECT/segundaleve

# Deploy Worker
gcloud run deploy segundaleve-worker \
  --image gcr.io/SEU_PROJECT/segundaleve \
  --command "node src/worker.js" \
  --no-cpu-throttling \
  --min-instances 1

# Deploy API
gcloud run deploy segundaleve-api \
  --image gcr.io/SEU_PROJECT/segundaleve \
  --command "node src/server.js"
```

## Configuração de Jobs

```env
JOB_MAX_ATTEMPTS=3           # Máximo de tentativas antes de DLQ
JOB_RUNNING_TIMEOUT_MINUTES=10  # Timeout para detectar jobs travados
JOB_POLL_INTERVAL_MS=2000    # Intervalo de polling do worker
```

---

## Índices Firestore

O sistema evita índices compostos sempre que possível, fazendo ordenação em memória.
Porém, para melhor performance em produção com grande volume, considere criar:

### Índices Recomendados

#### Collection: `jobs`

```
# Para listagem de jobs por tenant ordenados por data
Collection ID: jobs
Fields: tenantId (Ascending), createdAt (Descending)
Query scope: Collection

# Para buscar jobs travados
Collection ID: jobs
Fields: status (Ascending), lockedAt (Ascending)
Query scope: Collection
```

#### Collection: `plans`

```
# Para listagem de planos por tenant ordenados por data
Collection ID: plans
Fields: tenantId (Ascending), generatedAt (Descending)
Query scope: Collection
```

### Como Criar Índices

**Via Firebase Console:**
1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em Firestore Database → Indexes
4. Clique em "Create Index"
5. Preencha Collection ID, Fields e Query scope

**Via Firebase CLI:**

```bash
# Instalar CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init firestore

# Editar firestore.indexes.json
```

Exemplo de `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lockedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "plans",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "generatedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:

```bash
firebase deploy --only firestore:indexes
```

### Detectando Índices Necessários

Quando uma query requer índice não existente, o Firestore retorna erro com link direto para criar o índice:

```
FAILED_PRECONDITION: The query requires an index. 
You can create it here: https://console.firebase.google.com/...
```

Basta clicar no link para criar automaticamente.

---

## Observabilidade

### Logs Estruturados

Todos os logs seguem o formato:
```
[PREFIXO] [TIMESTAMP] [REQUEST_ID] message { metadata }
```

Prefixos: `API`, `WORKER`, `CRON`, `FIRESTORE`

### Métricas

`GET /ops/metrics` retorna:

```json
{
  "ok": true,
  "data": {
    "jobs": {
      "total": 100,
      "queued": 5,
      "running": 2,
      "successLast24h": 45,
      "errorLast24h": 3,
      "errorFinalLast24h": 1
    },
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Multi-Tenancy

- Autenticação via header `x-api-key`
- API key é hasheada (SHA256) e buscada em `api_keys/{hash}`
- Cada request popula `req.tenant` com dados do tenant
- Todas as queries filtram por `tenantId`

### Criar Tenant

```bash
node scripts/seed_tenant.js
```

---

## Licença

Privado - TERRAPRISMA
