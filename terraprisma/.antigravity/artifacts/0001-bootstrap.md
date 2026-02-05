# TERRAPRISMA Bootstrap Artifact

## 📋 Checklist de Criação

### Estrutura de Pastas
- [x] `terraprisma/` - Pasta raiz do projeto
- [x] `src/` - Código fonte principal
- [x] `src/controllers/` - Controllers da API
- [x] `src/modules/` - Módulos de conexão (SQL Server, MongoDB, MySQL)
- [x] `src/middlewares/` - Middlewares (auth JWT)
- [x] `src/services/` - Serviços de negócio
- [x] `src/templates/` - Templates (email, etc.)
- [x] `src/utils/` - Utilitários
- [x] `src/uploads/` - Arquivos enviados
- [x] `scripts/` - Scripts de deploy

### Arquivos de Configuração
- [x] `package.json` - Dependências e scripts
- [x] `.env_example` - Template de variáveis de ambiente
- [x] `.env` - Variáveis de ambiente local (NÃO COMITAR)
- [x] `.gitignore` - Exclusões do git
- [x] `.eslintrc.json` - Configuração ESLint
- [x] `ecosystem.config.js` - Configuração PM2
- [x] `startPM2.bat` - Script Windows para iniciar PM2

### Arquivos de Código
- [x] `src/server.js` - Entry point do servidor
- [x] `src/app.js` - Configuração Express
- [x] `src/config.js` - Configurações centralizadas
- [x] `src/router.js` - Rotas da API
- [x] `src/cron.js` - Jobs agendados
- [x] `src/middlewares/auth.js` - Middleware JWT
- [x] `src/modules/connectionSqlServer.js` - Conexão SQL Server
- [x] `src/modules/connectionMongoDB.js` - Conexão MongoDB
- [x] `src/modules/connectionMySQL.js` - Conexão MySQL

---

## 🚀 Comandos de Execução

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Rodar API em desenvolvimento (com hot reload)
npm run dev

# Rodar Cron em desenvolvimento
npm run dev:cron
```

### Produção (PM2)
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Ou usar o script Windows
startPM2.bat

# Reload sem downtime (recomendado para deploys)
pm2 reload ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs terraprisma-api
pm2 logs terraprisma-cron
```

### Deploy com Git
```powershell
# Usar script PowerShell (git pull + pm2 reload)
.\scripts\PullAndRestart.ps1
```

---

## 🔒 Notas de Segurança

> [!CAUTION]
> **NUNCA faça commit do arquivo `.env`** - Ele contém segredos (JWT, senhas de banco, chaves AWS).

> [!WARNING]
> **Não execute comandos destrutivos** sem confirmação explícita (drop database, rm -rf, reset, etc.)

> [!IMPORTANT]
> - Use `.env_example` como template para criar seu `.env` local
> - Mantenha as chaves de produção separadas das de desenvolvimento
> - Não exponha endpoints sensíveis sem autenticação (use o middleware `auth`)

---

## 🧪 Validação

### Health Check
```
GET http://localhost:3000/status
```
Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T14:02:55.000Z"
}
```

### Cron
Ao executar `npm run dev:cron`, deve aparecer no console:
```
Cron jobs iniciados...
```

---

## 📁 Estrutura Final

```
terraprisma/
├── .antigravity/
│   └── artifacts/
│       └── 0001-bootstrap.md
├── .env
├── .env_example
├── .gitignore
├── .eslintrc.json
├── package.json
├── ecosystem.config.js
├── startPM2.bat
├── scripts/
│   └── PullAndRestart.ps1
└── src/
    ├── server.js
    ├── app.js
    ├── config.js
    ├── router.js
    ├── cron.js
    ├── controllers/
    │   └── .gitkeep
    ├── modules/
    │   ├── connectionSqlServer.js
    │   ├── connectionMongoDB.js
    │   └── connectionMySQL.js
    ├── middlewares/
    │   └── auth.js
    ├── services/
    │   └── .gitkeep
    ├── templates/
    │   └── .gitkeep
    ├── utils/
    │   └── .gitkeep
    └── uploads/
        └── .gitkeep
```
