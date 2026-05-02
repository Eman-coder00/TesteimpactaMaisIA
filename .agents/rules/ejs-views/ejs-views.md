---
description: Padrões das views EJS e partials do blog.
globs: views/**/*.ejs
alwaysApply: false
---

# Views EJS

- Reutilizar **partials**: `views/partials/navbar.ejs`, `footer.ejs` via `<%- include(...) %>`.
- Passar ao `res.render(...)` apenas as **locals** necessárias (ex.: `posts`, `error`, `values`, `ok`) — evitar globais fictícios.
- Conteúdo gerado a partir do usuário: usar escaping padrão do EJS (`<%= %>`); HTML confiável só com intenção explícita (`<%-` com cuidado).
- Formulários: `method`/`action` corretos (`POST` para cadastro/login); nomes dos campos alinhados a `req.body` no servidor.
- Manter **HTML semântico** e classes compatíveis com `public/css/style.css` antes de criar CSS novo.
