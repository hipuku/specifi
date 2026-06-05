# specifi

CSS specificity visualiser in the browser. Live at [specifi.hipuku.dev](https://specifi.hipuku.dev).

## Tools

**Analyse** — parse any selector and see its three-axis score (a, b, c) with a full token-by-token breakdown of every ID, class, attribute, pseudo-class, and element.

**Compare** — enter two selectors side by side; the tool computes which wins and why, with inline token visualisation for each.

**Rank** — paste any stylesheet; all selectors are extracted, deduplicated, and sorted highest-to-lowest by specificity.

## Parser

The core is a from-scratch tokeniser → recursive descent parser → specificity calculator in TypeScript. It handles the full CSS Selectors Level 4 surface area: `:not()`, `:is()`, `:has()`, `:where()`, `:nth-child(An+B of S)`, attribute operators, pseudo-elements, combinators, and selector lists.

## Stack

- React 19 + TypeScript
- Vite, Tailwind CSS v4, Base UI (headless form primitives)
- Parkinsans + Geist Mono (Google Fonts)

## Development

```bash
npm install
npm run dev
```

See [DECISIONS.md](DECISIONS.md) for engineering rationale.
