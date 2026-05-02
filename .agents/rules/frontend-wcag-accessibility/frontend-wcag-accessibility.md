---
description: Ao editar frontend (views EJS, CSS/JS públicos), aplicar WCAG 2.1 AA e o checklist da skill wcag-21-aa-testing.
globs: views/**/*.ejs,public/**/*
alwaysApply: false
---

# Frontend → acessibilidade (WCAG 2.1 AA)

Qualquer mudança em **`views/`** ou **`public/`** deve seguir integralmente a skill do projeto **`wcag-21-aa-testing`**: ler `.agents/skills/wcag-21-aa-testing/SKILL.md` e usar como checklist de trabalho — não apenas sugestões opcionais.

## Pontos obrigatórios (resumo)

- **Contraste:** texto ordinário ≥ 4.5:1; texto grande ≥ 3:1 onde aplicável (**1.4.3**).
- **Teclado:** interação essencial só com Tab, Enter, Space, Escape; foco sempre visível (**2.1.1**, **2.4.7**).
- **Imagens:** `alt` descritivo ou vazio só se decorativo; SVG/ícone decorativo com estratégia que não gere ruído no leitor (**1.1.1**).
- **Formulários:** `label for`/`fieldset`/`legend`; erros ajuda com `aria-describedby`; obrigatório indicado também por texto, não só cor (**3.3.2**, **3.3.1**).
- **Estrutura:** um fluxo coerente de `h1`–`h2`–`h3`; `main`, `nav`, `header`, `footer` onde couber (**1.3.1**).
- **Layout:** layouts críticos usáveis até zoom ~200%; alvos clicáveis com área suficiente (`prefers-reduced-motion` onde houver animação relevante como extra).

Nova imagem, link, botão, formulário ou bloco principal de layout: revisar esse resumo antes de concluir o commit ou a tarefa.
