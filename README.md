# specifi

A CSS specificity visualiser, built on a from-scratch Selectors Level 4 parser. Live at [specifi.hipuku.dev](https://specifi.hipuku.dev).

## Tools

- **Analyse** a selector: its (a, b, c) score, token by token.
- **Compare** two selectors: which wins, and why.
- **Rank** a stylesheet: every selector, sorted by specificity.

The parser handles `:is()`, `:where()`, `:not()`, `:has()`, `:nth-child(An+B of S)`, attribute operators, pseudo-elements, combinators and selector lists.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, [kern](https://github.com/hipuku/kern).

## Development

```bash
npm install
npm run dev
```

`npm test`, `npm run lint` and `npm run typecheck` run the checks CI runs.

## Licence

MIT
