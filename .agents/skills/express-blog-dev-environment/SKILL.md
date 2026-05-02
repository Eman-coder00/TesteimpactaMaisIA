---
name: express-blog-dev-environment
description: Subir e validar ambiente local do blog Express (MongoDB, .env). Use ao rodar o projeto, depurar conexão com o banco ou orientar setup de desenvolvimento.
---

# Ambiente de desenvolvimento — blog Express

## Pré-requisitos

- Node.js LTS
- MongoDB acessível em `MONGODB_URI` (padrão comum `mongodb://127.0.0.1:27017`)

## Passos

1. Na raiz do repositório: `npm install`
2. Copiar `.env.example` para `.env` e ajustar `MONGODB_URI` e `MONGODB_DB` conforme o ambiente (o exemplo define o nome do database).
3. Subir o servidor:
   - `node index.js` — porta **3000**
   - ou `npm run dev` — recarrega com **nodemon**
4. Abrir `http://localhost:3000`

## MongoDB

- No shell: `mongosh` e usar o mesmo nome de database configurado em `MONGODB_DB` no `.env`.
- Índice único em `users.email` é criado na subida da aplicação.

## Falha comum

- **Falha ao iniciar / connect:** MongoDB não está rodando ou `MONGODB_URI` incorreto — verificar processo/porta e `.env`.

## Documentação de produto

- Escopo funcional pode estar em `docs/prd/` (complementa o README na raiz).
