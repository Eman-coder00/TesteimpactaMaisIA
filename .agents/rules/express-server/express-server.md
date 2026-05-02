---
description: Convenções do servidor Express e rotas neste repositório.
globs: index.js
alwaysApply: false
---

# Express (`index.js`)

- Ordem habitual: `express.urlencoded({ extended: true })` → `express.static('public')` → rotas → `listen`.
- **`db`:** conecte `MongoClient` uma vez em `main()`; atribua `db = client.db(DB_NAME)` antes de registrar rotas que usam o banco.
- **Cadastro/usuários:** `insertOne` com `passwordHash` (bcrypt); tratar erro **11000** (e-mail duplicado) ao cadastrar.
- **Posts:** objeto `posts` em memória alimenta listagem/detalhe hoje — evoluir para MongoDB deve preservar URLs amigáveis e alinhar com o PRD (autorização por autor).
- **Erros:** `console.error` no servidor para falhas inesperadas; respostas ao cliente com mensagens claras sem vazar stack em produção.

Novas rotas POST que alteram dados: validar entrada no servidor sempre (nunca confiar só no HTML).
