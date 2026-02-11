# TERRAPRISMA Auth Kit — README

> Auth system reutilizável com JWT + Firestore (sem Firebase Auth).
> **Status: Production-Ready** ✅

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Database | Firebase Firestore (Admin SDK) |
| Auth | JWT (custom, sem Firebase Auth) |
| Frontend | Vite + React |

---

## Setup Rápido

### 1. Backend

```bash
cd terraprisma
cp .env.example .env   # Edite com seus valores
npm install
npm run dev
```

### 2. Frontend

```bash
cd terraprisma-web
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

### 3. Firestore Setup (obrigatório)

No Firebase Console → Firestore, crie:

**Coleção `AUTH_COUNTERS`** → documento `users`:
```json
{ "next_id_auth_counters": 1 }
```

> ⚠️ Emails são sempre armazenados em lowercase. Não crie docs manualmente com case misto.

---

## Variáveis de Ambiente

### Backend (`.env`)

| Var | Obrigatória | Default | Descrição |
|-----|-------------|---------|-----------|
| `PORT` | Não | `3000` | Porta do servidor |
| `NODE_ENV` | Não | `development` | `development` / `production` |
| `JWT_SECRET` | **Sim** | — | Secret para JWTs (min 32 chars em prod) |
| `JWT_EXPIRES_IN` | Não | `1d` | Expiração do token (`15m`, `1h`, `1d`) |
| `CORS_ALLOWED_ORIGINS` | Não | `http://localhost:5173,...` | Origens permitidas (ver abaixo) |
| `TRUST_PROXY_HOPS` | Não | `1` | Nº de proxies na frente (Nginx=1, CF+Nginx=2) |
| `FIREBASE_PROJECT_ID` | Sim* | — | Project ID |
| `FIREBASE_CLIENT_EMAIL` | Sim* | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | Sim* | — | Private key (`\n` escaped) |

*\*Alternativa: `secrets/serviceAccountKey.json`*

#### CORS — Formato Correto

**Origin = scheme + host + port.** Cada origem DEVE incluir `http://` ou `https://`:

```bash
# ✅ Correto
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ✅ Produção
CORS_ALLOWED_ORIGINS=https://app.seudominio.com,https://www.app.seudominio.com

# ❌ Errado (sem scheme — será ignorado em prod, auto-corrigido em dev)
CORS_ALLOWED_ORIGINS=localhost:5173
```

#### Trust Proxy

Em produção atrás de reverse proxy, `trust proxy` garante que `req.ip` e rate limiter usem o IP real:

| Setup | `TRUST_PROXY_HOPS` |
|-------|--------------------|
| Nginx direto | `1` |
| Cloudflare + Nginx | `2` |
| Sem proxy (direto) | `0` |

### Frontend (`.env`)

| Var | Default | Descrição |
|-----|---------|-----------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | URL base da API |

---

## Endpoints

| Method | Path | Auth | Payload | Resposta |
|--------|------|------|---------|----------|
| `POST` | `/register` | Não | `{ username, email, password }` | 201 `{ message, userId }` |
| `POST` | `/authenticate` | Não | `{ login, password }` | 200 `{ token, user }` |
| `GET` | `/me` | Bearer | — | 200 `{ ok, userId, user }` |
| `PATCH` | `/admin/users/:id/whitelist` | Bearer+Admin | `{ is_whitelisted: bool }` | 200 `{ ok, id, is_whitelisted }` |
| `GET` | `/health` | Não | — | 200 `{ ok, env, uptime }` |

## Códigos de Erro Auth

| tipoErro | HTTP | Significado |
|----------|------|-------------|
| `-1` | 401 | Senha incorreta |
| `-2` | 403 | Conta bloqueada |
| `-3` | 401 | Não está na whitelist |
| `-4` | 404 | Usuário não encontrado |
| — | 429 | Rate limit (10 req/15min) |
| — | 400 | `{ error: "validation_error", details: [{field, message}] }` |

---

## Segurança (Hardening)

| Feature | Detalhe |
|---------|---------|
| Helmet | Headers de segurança em todas as responses |
| Morgan | `dev` (colorido) em dev, `combined` (Apache) em prod |
| CORS | Restrito a `CORS_ALLOWED_ORIGINS` (com validação de scheme) |
| Rate limit | 10 tentativas / 15 min no `/authenticate` |
| Body limit | 10kb max |
| Validação | express-validator no register/authenticate |
| Email norm | `toLowerCase() + trim()` no register |
| Error handlers | 404/500 JSON (sem stacktrace em prod) |
| Trust proxy | Parametrizável via `TRUST_PROXY_HOPS` |
| bcrypt | Salt rounds 12 |
| JWT | `verify()` (não `decode`), rejeita expirado/inválido |

---

## Deploy

### Opção A — PM2

```bash
# Criar diretório de logs (obrigatório)
mkdir -p logs

# Instalar PM2 e iniciar
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 logs terraprisma-api

# Logrotate (recomendado)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

> 💡 O repo já inclui `logs/.gitkeep` para garantir que o diretório existe no clone.

### Opção B — Docker

```bash
docker compose up -d --build
docker compose logs -f
```

### Reverse Proxy

Veja `nginx.conf` para template Nginx com TLS + proxy headers.

---

## Frontend Auth Kit

```
src/auth/
├── AuthContext.jsx    # Provider: signIn, signUp, signOut, isAuthenticated
├── authService.js    # API + mapeamento de erros → PT-BR
├── http.js           # Axios: interceptors (token + auto-logout 401)
├── storage.js        # Abstração localStorage
└── ProtectedRoute.jsx # Guard: loading → redirect → render
```

---

## Testes Rápidos

```bash
# Health + Helmet headers
curl -i http://localhost:3000/health

# 404 JSON
curl http://localhost:3000/nonexistent

# Register inválido
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"x","password":"1"}'

# CORS bloqueando origin
curl -i http://localhost:3000/health -H "Origin: https://evil.com"
```
