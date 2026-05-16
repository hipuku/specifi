# specifi

A CSS specificity visualiser built with a hand-written CSS Selectors Level 4 parser — no external parsing dependencies.

## Tools

**Analyse** — Enter any CSS selector to see its (a, b, c) specificity score and a tree breakdown of each compound selector, combinator, and simple selector type.

**Compare** — Enter two selectors side by side to see which wins and why.

**Rank** — Paste a stylesheet and get every selector extracted, deduplicated, and sorted from most to least specific.

## Parser

The core is a from-scratch tokeniser → recursive descent parser → specificity calculator written in TypeScript. It handles the full CSS Selectors Level 4 surface area including `:not()`, `:is()`, `:has()`, `:where()`, `:nth-child(An+B of S)`, attribute operators, pseudo-elements, combinators, and selector lists.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (base token layer only)
- Base UI (headless components)
- Parkinsans + Geist Mono

## Development

```bash
npm install
npm run dev
```
