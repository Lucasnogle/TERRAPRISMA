Contexto: Você é o Arquiteto de Software Sênior do projeto Terraprisma. Este documento contém TUDO o que você precisa saber sobre o sistema para continuar o desenvolvimento, corrigir bugs ou criar novos produtos.

1. O que é o Terraprisma?
O Terraprisma é um Hub de Automação e Backend SaaS robusto, construído para escalabilidade. Ele não é apenas uma API; é uma fábrica de processamento assíncrono.

Arquitetura Principal: Producer-Consumer (Produtor-Consumidor).

API (Produtor): Recebe requisições HTTP rápidas, autentica usuários e enfileira trabalhos no banco de dados. Nunca trava esperando um processo pesado.
Worker (Consumidor): Um serviço separado que monitora o banco de dados em tempo real, pega trabalhos "na fila" e os executa (envio de e-mail, geração de PDF, integrações).
2. Tech Stack (Tecnologias)
Linguagem: Node.js (JavaScript).
Framework Web: Express.js (para a API).
Banco de Dados: Google Firebase Firestore (NoSQL).
Autenticação: JWT (JsonWebToken) + Firebase Auth (validado via Admin SDK).
Infraestrutura: Google Cloud Platform (via Service Accounts).
Bibliotecas Chave:
firebase-admin: SDK oficial para conectar no Firebase com privilégios totais.
node-cron: Para agendamento de tarefas recorrentes (CRON Jobs).
dotenv: Gerenciamento de variáveis de ambiente seguras.
google-auth-library: Autenticação segura com Google.
3. Estrutura de Pastas e Arquivos
O projeto segue uma Clean Architecture simplificada.

text
/terraprisma
├── /.env                  # [SEGREDO] Credenciais (NÃO COMITAR)
├── /src
│   ├── /controllers       # Lógica de entrada das rotas (Validações, Respostas HTTP)
│   │   ├── automationController.js  # Controla criação de tarefas via API
│   │   └── userController.js        # Login e Gestão de Usuários
│   ├── /middlewares       # Filtros da API
│   │   └── auth.js                  # Protege rotas exigindo JWT válido
│   ├── /modules           # Lógica de Negócio Pura e Conexões
│   │   ├── automationModule.js      # Regras de negócio da automação
│   │   ├── connectionFirebase.js    # Singleton de conexão com Firestore
│   │   └── userModule.js            # Regras de negócio de usuários (Login/Busca)
│   ├── /services          # Serviços externos e utilitários
│   │   ├── firebaseServices.js      # Helpers do Firebase
│   │   └── jobService.js            # O CORAÇÃO DO WORKER (Cria e Processa Jobs)
│   ├── /utils             # Pequenas funções auxiliares
│   ├── app.js             # Configuração do Express (CORS, JSON)
│   ├── config.js          # Centralizador de variáveis de ambiente
│   ├── cron.js            # Entrada do processo de Cron Jobs
│   ├── router.js          # Definição de todas as rotas da API
│   ├── server.js          # Ponto de entrada da API (porta 3000)
│   └── worker.js          # Ponto de entrada do Worker (loop infinito)
└── package.json           # Dependências e Scripts
4. Banco de Dados (Schema do Firestore)
O banco foi desenhado para ser flexível e orientado a documentos.

A. users (Usuários)
Quem pode logar no sistema.

json
{
  "email": "admin@terraprisma.com",
  "password": "hashed_password",
  "name": "Admin",
  "role": "admin",
  "status": "active"
}
B. tasks (Tarefas / Filas)
A fila de trabalho compartilhada entre API e Worker.

json
{
  "active": true,
  "attempts": 0,
  "createdAt": "Timestamp",
  "payload": { "to": "cliente@email.com", "body": "Olá..." },
  "status": "queued", // Fases: queued -> running -> success/error
  "type": "send_email"
}
C. version (Configuração)
Controle de versão do sistema.

json
{
  "current": "1.0.0",
  "min_supported": "1.0.0",
  "message": "Sistema Operacional"
}
D. access_keys (Integração)
Chaves para parceiros externos usarem a API.

json
{
  "key": "terra_x9z8...",
  "owner": "Empresa Parceira",
  "active": true
}
5. Fluxos Principais (Como funciona)
Fluxo 1: Autenticação
Usuário faz POST /authenticate com email/senha.
userController chama userModule.
userModule busca na coleção users do Firestore.
Se bater, gera um JWT assinado e devolve.
Fluxo 2: Criar uma Automação (API)
Usuário autenticado (Header Authorization) faz POST /tasks.
auth.js
 valida o token.
automationController recebe o payload.
jobService.createJob() salva um documento na coleção tasks com status queued.
API responde "Tarefa criada: ID 123" imediatamente (200 OK).
Fluxo 3: Processar a Automação (Worker)
worker.js
 roda em loop (ou via listener).
Chama jobService.claimNextJob().
Usa Transação do Firestore para buscar uma tarefa queued e mudar para running (evita duplicidade).
Executa a lógica baseada no type da tarefa.
Salva o resultado e muda status para success ou error.
6. Para o que utilizaremos? (Casos de Uso)
O Terraprisma é a base para escalar qualquer operação digital:

Disparos em Massa: Email Marketing, WhatsApp Blast (o Worker segura a carga sem travar).
Geração de Relatórios: Processar PDFs de 500 páginas em background.
ETL e Sincronização: Cron Jobs que puxam dados de um ERP e salvam no Firebase a cada hora.
Webhooks: Receber eventos do Stripe/PagSeguro e processar a liberação de acesso depois.
7. Comandos Essenciais
Rodar Tudo (Dev): npm run dev (Sobe API na 3000 e Worker em paralelo).
Rodar só API: npm run dev:api.
Rodar só Worker: npm run dev:worker.
Lint (Qualidade): npm run lint.
Este é o manual definitivo do Terraprisma (v1.0).