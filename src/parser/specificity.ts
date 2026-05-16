import type {
  Specificity,
  SpecificityResult,
  SelectorListNode,
  ComplexSelectorNode,
  CompoundSelectorNode,
  SimpleSelector,
  PseudoClassNode,
} from './types'
import { ZERO_SPECIFICITY_PSEUDOS, SELECTOR_PSEUDOS } from './types'
import { parse } from './parser'

function add(a: Specificity, b: Specificity): Specificity {
  return { a: a.a + b.a, b: a.b + b.b, c: a.c + b.c }
}

function max(a: Specificity, b: Specificity): Specificity {
  // Returns whichever is more specific (used for :is(), :not(), :has())
  if (a.a !== b.a) return a.a > b.a ? a : b
  if (a.b !== b.b) return a.b > b.b ? a : b
  return a.c >= b.c ? a : b
}

const ZERO: Specificity = { a: 0, b: 0, c: 0 }

function specificityOfSimple(node: SimpleSelector): Specificity {
  switch (node.type) {
    case 'IdSelector':
      return { a: 1, b: 0, c: 0 }

    case 'ClassSelector':
    case 'AttributeSelector':
      return { a: 0, b: 1, c: 0 }

    case 'TypeSelector':
      return { a: 0, b: 0, c: 1 }

    case 'UniversalSelector':
      return ZERO

    case 'PseudoElement':
      return { a: 0, b: 0, c: 1 }

    case 'PseudoClass':
      return specificityOfPseudoClass(node)
  }
}

function specificityOfPseudoClass(node: PseudoClassNode): Specificity {
  const name = node.name.toLowerCase()

  // :where() — always zero
  if (ZERO_SPECIFICITY_PSEUDOS.has(name)) return ZERO

  // :nth-child(An+B of S) — (0,1,0) for the pseudo-class itself plus max specificity of "of S"
  // Must be checked before the generic SELECTOR_PSEUDOS path since nth-child is in that set
  if ((name === 'nth-child' || name === 'nth-last-child') && node.argument && typeof node.argument !== 'string') {
    let argSpec = ZERO
    for (const sel of node.argument.selectors) {
      argSpec = max(argSpec, specificityOfComplex(sel))
    }
    return add({ a: 0, b: 1, c: 0 }, argSpec)
  }

  // :not(), :is(), :has(), :matches() — take max specificity of their argument list
  if (SELECTOR_PSEUDOS.has(name) && node.argument && typeof node.argument !== 'string') {
    let result = ZERO
    for (const sel of node.argument.selectors) {
      result = max(result, specificityOfComplex(sel))
    }
    return result
  }

  // All other pseudo-classes: (0, 1, 0)
  return { a: 0, b: 1, c: 0 }
}

function specificityOfCompound(node: CompoundSelectorNode): Specificity {
  return node.simples.reduce((acc, s) => add(acc, specificityOfSimple(s)), ZERO)
}

function specificityOfComplex(node: ComplexSelectorNode): Specificity {
  return node.parts
    .filter((p) => p.type !== 'Combinator')
    .reduce((acc, p) => add(acc, specificityOfCompound(p as CompoundSelectorNode)), ZERO)
}

export function specificityOfList(ast: SelectorListNode): Specificity[] {
  return ast.selectors.map(specificityOfComplex)
}

export function analyse(selector: string): SpecificityResult {
  try {
    if (/^\s*@/.test(selector)) {
      return {
        selector,
        specificity: ZERO,
        ast: { type: 'SelectorList', selectors: [] },
        error: `"${selector.trim()}" is an at-rule, not a CSS selector`,
      }
    }
    const ast = parse(selector)
    const specs = specificityOfList(ast)
    // For a single selector (no commas), return the first specificity
    // For selector lists, return the max (useful for stylesheet mode)
    const specificity = specs.reduce((acc, s) => max(acc, s), ZERO)
    return { selector, specificity, ast }
  } catch (err) {
    return {
      selector,
      specificity: ZERO,
      ast: { type: 'SelectorList', selectors: [] },
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export function compareSpecificity(a: Specificity, b: Specificity): -1 | 0 | 1 {
  if (a.a !== b.a) return a.a > b.a ? 1 : -1
  if (a.b !== b.b) return a.b > b.b ? 1 : -1
  if (a.c !== b.c) return a.c > b.c ? 1 : -1
  return 0
}

export function formatSpecificity(s: Specificity): string {
  return `(${s.a}, ${s.b}, ${s.c})`
}

const MAX_CSS_BYTES = 500_000 // 500 KB

// Extract all selectors from a CSS string for stylesheet mode
export function extractSelectors(css: string): Array<{ selector: string; line: number }> {
  if (css.length > MAX_CSS_BYTES) {
    throw new Error(`CSS input exceeds the ${MAX_CSS_BYTES / 1_000} KB limit`)
  }

  const results: Array<{ selector: string; line: number }> = []
  const lines = css.split('\n')
  let depth = 0
  let skipUntilDepth = -1

  // Buffer for accumulating selector text that spans multiple lines before a {
  let selectorBuffer = ''
  let selectorStartLine = -1

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i]
    const opens = (line.match(/\{/g) ?? []).length
    const closes = (line.match(/\}/g) ?? []).length

    if (skipUntilDepth < 0) {
      // Skip non-selector at-rules (@keyframes, @font-face, etc.)
      if (/^\s*@(?:-\w+-)?(?:keyframes|font-face)\b/i.test(line) && opens > 0) {
        skipUntilDepth = depth
        selectorBuffer = ''
        selectorStartLine = -1
      } else {
        const braceIdx = line.indexOf('{')
        if (braceIdx !== -1) {
          // Combine any buffered selector lines with the text before this brace
          const beforeBrace = line.slice(0, braceIdx).trim()
          const fullRaw = selectorBuffer
            ? selectorBuffer + (beforeBrace ? ' ' + beforeBrace : '')
            : beforeBrace
          if (fullRaw && !/^\s*@/.test(fullRaw)) {
            const startLine = selectorStartLine >= 0 ? selectorStartLine : lineNum
            for (const sel of fullRaw.split(',')) {
              const cleaned = sel.trim()
              if (cleaned) results.push({ selector: cleaned, line: startLine })
            }
          }
          selectorBuffer = ''
          selectorStartLine = -1
        } else if (depth === 0 && closes === 0) {
          // No braces at root depth — buffer as potential multi-line selector continuation
          const trimmed = line.trim()
          if (trimmed && !/^\s*@/.test(trimmed)) {
            if (selectorStartLine < 0) selectorStartLine = lineNum
            selectorBuffer = selectorBuffer ? selectorBuffer + ' ' + trimmed : trimmed
          }
        } else {
          // Closing braces or nested content — reset buffer
          selectorBuffer = ''
          selectorStartLine = -1
        }
      }
    } else {
      selectorBuffer = ''
      selectorStartLine = -1
    }

    depth += opens - closes
    if (skipUntilDepth >= 0 && depth <= skipUntilDepth) {
      skipUntilDepth = -1
    }
  }

  return results
}
