---
trigger: always_on
description: Stack e objetivos do blog CESMAC (Express, EJS, MongoDB). Use em qualquer mudança no repositório.
---

# Blog — contexto do projeto

- **Stack:** Node.js, **Express 5**, **EJS** (`views/`), **MongoDB** (driver nativo), **bcrypt** para senhas, **dotenv** para configuração.
- **Escopo produto:** requisitos e prioridades estão em `docs/prd/` (autenticação, perfil, posts para usuários logados).
- **Idioma da interface:** mensagens visíveis ao usuário em **português** (Brasil).
- **Dados:** banco `MONGODB_DB` (default `cesmac_blog`); usuários na coleção `users` com índice único em `email`; variáveis `MONGODB_URI` / `MONGODB_DB` via `.env` (ver `.env.example`).
- **Estático:** CSS e assets em `public/` (não embutir estilos grandes inline nas views sem necessidade).

Não introduzir outro servidor de templates, ORM ou framework frontend **salvo pedido explícito** — manter o padrão do material de aula.