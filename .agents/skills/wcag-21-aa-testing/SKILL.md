---
name: wcag-21-aa-testing
description: Auditoria e testes manuais alinhados a WCAG 2.1 nível AA — contraste, teclado, texto alternativo, ARIA, foco visível, hierarquia de títulos, formulários labels, reflow responsivo e leitores de tela. Use ao revisar HTML/CSS/EJS ou quando o usuário pedir acessibilidade, WCAG, a11y, Lighthouse, axe, NVDA ou navegação por teclado.
---

# WCAG 2.1 AA — auditoria e usabilidade acessível

## Quando usar

- Implementar ou revisar páginas web (HTML, templates EJS, CSS).
- Auditoria rápida antes de merge ou entrega acadêmica/profissional.

No repositório, mudanças em **`views/`** ou **`public/`** devem usar este documento como checklist obrigatório (regra **`frontend-wcag-accessibility`** em `.agents/rules/`).

---

## Mapa rápido (critérios centrais)

| Área | WCAG | O que conferir |
|------|------|----------------|
| Contraste | 1.4.3 | Texto normal ≥ **4.5:1**, texto grande (≥18pt ou 14pt bold) ≥ **3:1** em relação ao fundo |
| Teclado | 2.1.1 | Toda ação importante acessível **sem mouse** (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape` em diálogo) |
| Conteúdo não textual | 1.1.1 | `alt` adequado em imagens informativas; `alt=""` se puramente decorativas |
| Relações semânticas | 1.3.1 | `label`/`fieldset`/`legend`; `aria-*` só quando complementar árvore semântica |
| Foco visível | 2.4.7 | `:focus`/`:focus-visible` nunca removidos sem equivalente igualmente perceptível |

---

## Contraste (1.4.3)

- Preferir combinções verificadas (ex.: ferramentas abaixo); meta comum para texto corrido vs fundo: **≥ 4.5:1**.
- Componentes UI e estados (`:hover`, foco): contraste suficiente para ser identificável (ver também critérios 1.4.11 para componentes grafados).

---

## Teclado e skip link

- Primeiro focável pode ser um **skip link** para `#main-content` ou equivalente (`:focus-within` / visível no foco).
- Ordem do `Tab` coerente com leitura visual (em geral topo → rodapé, esquerda → direita).
- Não prendere foco indevidamente; modais/fechamento com **Escape** quando for padrão esperado.

---

## Imagens

- Informação na imagem → `alt` descritivo sucinto (idioma da página).
- Puramente decorativa → `alt=""`; ícones puramente cosméticos podem usar `aria-hidden="true"` no SVG container se redundante ao texto vizinho.

---

## ARIA (uso conscientioso)

- **`aria-label`**: quando texto visível insuficiente para contexto curto (tel. longo apenas como número pode precisar de contexto extra).
- **`aria-labelledby`** / **`aria-describedby`**: relacionar erro, ajuda e títulos a campos já existentes.
- **`aria-live="polite"|"assertive"`**: atualizações dinâmicas importantes para leitor de tela.
- **`aria-pressed`** / estados semânticos: preferir elementos nativos (`button`) quando possível.

---

## Focus visível (2.4.7)

CSS típico (ajustar cor ao tema respeitando contraste):

```css
:focus-visible {
  outline: 3px solid var(--focus-ring, CanvasText);
  outline-offset: 2px;
}
```

Evitar apenas `outline: none` sem substituto de alto contraste.

---

## Hierarquia de títulos (1.3.1)

- Um **único `h1`** por página quando fizer sentido documentalmente.
- Não saltar níveis sem necessidade (**h1 → h2 → h3** sequencial dentro de cada seção).
- `main`, `header`, `footer`, `nav`, `section` com headings ou `aria-labelledby` quando aplicável.

---

## Tipografia e zoom (1.4.4 reflow relacionado)

- Corpo próximo de **16px** base e **line-height** confortável (ex.: ≥ 1.5).
- Conteúdo deve **refluir**: zoom do navegador até **200%** sem truncamento crítico; evitar apenas layout fixo quando possível (**1.4.10 Reflow** em AA).

---

## Formulários (3.3.2 / 3.3.1)

- Todo controle nomeado por `<label for="id">` ou elemento envolvendo o input.
- Instruções e erros associados por `aria-describedby` onde o erro é dinâmico.
- Agrupamentos lógicos: `fieldset` + `legend`; campos obrigatórios claros (**texto** além só de cor).

---

## Responsividade (1.4.10)

- Breakpoints típicos cobrem pelo menos viewport estreito (~**320px**) e larguras comuns (**768**, **1024**, **≥1200px**).
- Áreas clicáveis mínimas em torno de **44×44 px** onde couber (**2.5.5 Target Size** nível AAA alvo desejável; em AA vale evitar botões microscopicamente pequenos).

---

## Checklist manual (resumido)

**Teclado**

- [ ] Percurso completo apenas com Tab/Shift+Tab
- [ ] Skip link opcional útil onde há navegação longa repetida
- [ ] Estado de foco sempre distinguível

**Contraste**

- [ ] Lighthouse / axe sem falhas críticas de contraste onde aplicável ao design

**Conteúdo**

- [ ] `alt`/decorações revisados
- [ ] Heading outline sem níveis estranhamente pulados

**Formulários**

- [ ] Labels e erros anunciáveis logicamente por leitor de tela

**Reflow / tátil**

- [ ] Zoom 200% utilizável em páginas-chave

---

## Ferramentas

| Ferramenta | Uso |
|------------|-----|
| **Lighthouse** (Chrome DevTools) | Auditoria automatizada rápida |
| **axe DevTools** | Regras WCAG detalhadas no DOM |
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | Razão foreground/background |

**Leitores de tela**: NVDA (Windows/Linux), Narrator/JAWS onde disponível; **VoiceOver** (macOS/iOS). Testes manuais com teclado + um leitor já cobrem muitos problemas graves.

---

## Passos práticos mínimos

1. Lighthouse **Accessibility** ≥ alvo institucional (100 ideal; investigar mesmo com 90–100).
2. Percorrer página só com **teclado** uma vez inteira.
3. **Zoom** 200 % na home e em um fluxo principal (login, formulário longo).

---

## Além disso (AAA / backlog comum)

- `prefers-reduced-motion`: reduzir animações não essenciais.
- Contraste aprimorado e alvos grandes podem mirar nível AAA onde houver política interna.

---

## Referências oficiais

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI Overview](https://www.w3.org/WAI/)

---

### Princípio final

Design e marcação inclusivos aumentam público alcance e cumprimento legal comum (**WCAG AA** frequentemente baseline em licitações e políticas institucionais).
