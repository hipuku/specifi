# specifi — design notes

Annotated intent. What this tool does and why each significant decision was made. Not a spec — engineering notes for a new contributor or future self. If something in the code looks over-engineered or under-engineered, the answer is probably here.

---

## What it is

A CSS specificity calculator that runs entirely in the browser. Three tools: analyse a single selector with a full parse-tree breakdown, compare two selectors side by side to see which wins and why, and rank a full stylesheet by sorting every selector from most to least specific. No backend, no cloud APIs — every computation is client-side.

---

## Why a hand-written parser over css-tree

The obvious approach would be to feed the selector string into an existing CSS parser — css-tree, postcss-selector-parser, or lightningcss — and walk the AST. That would work for the basic (a, b, c) count, but the specificity calculation IS the engineering thesis of the project. Delegating it to a library reduces the code to a thin wrapper around someone else's work.

The more substantive reason: the specificity algorithm requires understanding the internal semantics of several pseudo-classes that no general-purpose CSS parser exposes as a calculated value. `:nth-child(An+B of S)` must add `(0,1,0)` for the pseudo-class itself *plus* the max specificity of the selector argument `S`. `:is()`, `:not()`, and `:has()` each take the max specificity of their argument list, not their own name. `:where()` always contributes zero regardless of what is inside. A library gives you the AST node — you still have to walk it with this exact logic. The parser here is purpose-built to produce the AST shape the specificity engine needs.

Reference: CSS Selectors Level 4 specification (W3C), §16 Calculating a selector's specificity. Håkon Wium Lie's original CSS proposal (1994) which introduced specificity as a conflict-resolution mechanism.

---

## Tokeniser → parser → AST pipeline

The parser is structured as three stages: tokeniser → recursive descent parser → specificity engine. This mirrors the classical compiler frontend and matches the formal BNF grammar in the CSS Selectors Level 4 spec.

Each stage is independently testable. The tokeniser produces a flat token stream (`HASH`, `DOT`, `COLON`, `IDENT`, combinators, brackets, operators). The parser produces a typed AST (`SelectorList` → `ComplexSelector` → `CompoundSelector` → simple selectors). The specificity engine walks the AST without touching the token stream or the raw string.

The alternative — a single-pass regex approach — would save lines of code but would be untestable at the token level, fragile against edge cases like nested parentheses in `:nth-child(2n+1 of .class)`, and impossible to extend for future visualisation work that needs positional information.

---

## Three-axis model (a, b, c)

The specificity score is a three-column tuple, not a single integer. Column a counts ID selectors. Column b counts class selectors, attribute selectors, and pseudo-classes. Column c counts type selectors and pseudo-elements. Combinators, the universal selector, and `:where()` contribute nothing.

Critically, columns are compared left to right — not added into a single number. `(1,0,0)` always beats `(0,99,99)`. This is why the comparison function checks `a.a !== b.a` first, then `b.b`, then `c.c`, and returns only when a column differs. Collapsing to a single number (e.g. `a * 10000 + b * 100 + c`) would produce wrong results once any column exceeds 99, and some real-world stylesheets do have selectors with more than 99 class compounds.

---

## `:is()`, `:not()`, `:has()` take the max of their argument list

These three pseudo-classes have *forgiving selector list* semantics: the browser ignores invalid selectors in the argument rather than invalidating the whole rule. Their specificity is the max specificity of the most specific valid selector in the list, not the specificity of the pseudo-class name itself.

`:not(.foo, #bar)` has specificity `(1,0,0)` — the `#bar` argument dominates. `:is(h1, h2, .heading)` has specificity `(0,1,0)` — the `.heading` class dominates. This is intentional in the spec: it lets authors use `:is()` for grouping without losing specificity control.

The `max()` helper in specificity.ts handles this. It compares two specificity tuples and returns the more specific one, using the same left-to-right column rule. The specificity engine calls it in a reduce loop over the argument selectors.

`:matches()` is treated identically to `:is()` — it is the earlier name for the same feature.

---

## `:nth-child(An+B of S)` is a special case

`:nth-child(2n+1 of .highlighted)` selects every odd element that also matches `.highlighted`. The specificity is `(0,1,0)` for the pseudo-class itself *plus* the max specificity of the `of S` selector argument. This is the only pseudo-class in the Level 4 spec where the base specificity and the argument specificity are *added* rather than the argument replacing the base.

The parser detects this by checking whether the argument token stream contains a selector list node (parsed by the same recursive descent path) rather than a plain string like `2n+1`. The `nth-child` and `nth-last-child` branches in `specificityOfPseudoClass` are checked before the generic `SELECTOR_PSEUDOS` path because both names appear in that set.

---

## Stylesheet extraction without a full CSS parser

The Rank tool accepts a full CSS string and extracts every selector. This uses a line-by-line scanner rather than a complete CSS parser.

The scanner tracks brace depth to identify selector text (the content before a `{` at the current depth) and rule body text (between `{` and `}`). It skips `@keyframes` and `@font-face` blocks because their internal identifiers (`from`, `to`, percentage values) are not CSS selectors and would produce parse errors. Block comments are stripped before scanning — replaced with spaces that preserve newlines so reported line numbers remain accurate.

A full CSS parser would be more correct but would also add a dependency for a feature that only needs to extract the selector strings that the existing specificity engine can then handle. The scanner handles real-world stylesheets including multi-line selectors, nested at-rules, and selector lists with commas.

Accepted limitation: the scanner does not handle CSS nesting (`&`) — nested selectors inside rule blocks are silently skipped. CSS nesting specificity follows different rules (the `&` refers to the parent specificity) and would need a separate analysis pass.

---

## 500 KB stylesheet input limit

The Rank view caps input at 500 KB. This is a practical safety limit to avoid hanging the browser tab on accidental paste of a concatenated production bundle. A minified production stylesheet rarely exceeds 200 KB; 500 KB gives significant headroom for unminified source.

The limit is checked before any parsing begins and surfaces a readable error message rather than silently degrading.

---

## Deduplication in Rank

The Rank view deduplicates selectors by exact string match before scoring. A real stylesheet often has the same selector across multiple rules — two `a:hover` declarations, or a class repeated in media queries. Showing each occurrence separately would flood the ranked list with identical rows.

Deduplication keeps the first occurrence (lowest line number) and discards subsequent matches. The line number shown is where the selector first appears. This is a deliberate simplification: it does not aggregate multiple rules for the same selector or show all occurrence sites.

---

## Routing: no router library

ViewId is `useState<'about' | 'analyse' | 'compare' | 'rank'>`. No React Router, no TanStack Router.

specifi has four views, no deep-linkable state worth preserving, and no URL-driven behaviour. Adding a router library would introduce boilerplate for zero functional gain at this scale. The pattern is identical to hexicon for the same reasons.

If sharing a specific comparison becomes useful — e.g. `/compare?a=.card%3Ahover&b=%23app%20button` — that is the point to add a router, not before.

---

## Accepted tradeoffs

**No preprocessor support.** The stylesheet extractor works on raw CSS. Sass nesting (`&.modifier`), Less variable interpolation, and PostCSS transforms are invisible to it. Specificity is a CSS-level concept; preprocessing happens before the cascade sees the output. This is by design.

**CSS nesting not handled.** CSS native nesting (`@nest`, `&`) is not extracted or scored. The `&` combinator references the parent rule's specificity in a context-dependent way that the single-pass extractor cannot resolve. Silently skipped.

**Selector list specificity in Analyse.** When a selector contains a comma — a selector list — `analyse()` returns the max specificity across all selectors in the list. This is the correct behaviour for Rank mode (where you want a single representative score per extracted selector) but is arguably an approximation in Analyse mode (where each comma-separated selector could be shown separately). The parse tree display does show each compound selector; the headline tuple reflects the max.

**No at-rule specificity.** `@layer`, `@scope`, and `@supports` affect cascade priority but not specificity. They are out of scope: the tool calculates specificity as defined in the selectors spec, not the full cascade order.
