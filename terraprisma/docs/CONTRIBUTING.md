# Guia de Contribuição - SEGUNDA LEVE

Bem-vindo ao desenvolvimento do Segunda Leve! Siga estes padrões para manter a qualidade do código.

## Estrutura de Pastas

- Pastas devem ser sempre **lowercase** (`controllers`, `services`, `utils`).
- Arquivos devem ser **camelCase** (`jobService.js`, `userController.js`).

## Padrões de Código

### 1. Separação de Responsabilidades
- **Controllers**: Apenas recebem requisição, extraem dados, chamam serviços e respondem. Não devem conter regras de negócio.
- **Services**: Contém todas as regras de negócio. Devem ser "puros" e independentes do Express (não podem receber `req` ou `res`).

### 2. Async/Await
- Use sempre `async/await`.
- Em controllers, envolva manipuladores com `asyncHandler`.
- **Nunca** use try/catch repetitivo em controllers; o `errorHandler` global cuidará disso.

### 3. Validação
- Use schemas Zod na pasta `src/validators`.
- Valide inputs antes de chamar serviços.

### 4. Logging
- **PROIBIDO** usar `console.log` ou `console.error`.
- Use o logger estruturado em `src/utils/logger.js`.
- Exemplo: `loggers.api.info('User created', { userId })`.

### 5. Tratamento de Erros
- Lance erros com mensagens claras.
- Use `throw new Error('Mensagem')` em services.
- O `errorHandler` converterá para JSON padronizado.

## TODOs
Use o formato: `// TODO(SEGUNDA-LEVE): Descrição da tarefa`

## Testes
- Rode `npm test` antes de enviar PRs.
- Adicione testes para novas rotas em `tests/`.

---
*Mantido pelo time Engineering do Segunda Leve.*
