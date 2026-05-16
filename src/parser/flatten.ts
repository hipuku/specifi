import type {
  SelectorListNode,
  ComplexSelectorNode,
  CombinatorNode,
  SimpleSelector,
} from './types'
import { ZERO_SPECIFICITY_PSEUDOS } from './types'

const HTML_ELEMENTS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'math', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'search', 'section', 'select', 'slot', 'small', 'source',
  'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
])

export type TokenAxis = 'a' | 'b' | 'c' | 'zero' | 'combinator' | 'unknown'

export interface DisplayToken {
  text: string
  axis: TokenAxis
  label: string         // "ID", "class", "pseudo-class", "element", etc.
  isCombinator: boolean
}

export function simpleToToken(node: SimpleSelector): DisplayToken {
  switch (node.type) {
    case 'IdSelector':
      return { text: `#${node.name}`, axis: 'a', label: 'ID', isCombinator: false }

    case 'ClassSelector':
      return { text: `.${node.name}`, axis: 'b', label: 'class', isCombinator: false }

    case 'AttributeSelector': {
      // node is narrowed to AttributeSelectorNode by the switch discriminant
      const text = node.operator ? `[${node.attribute}${node.operator}"${node.value}"]` : `[${node.attribute}]`
      return { text, axis: 'b', label: 'attribute', isCombinator: false }
    }

    case 'PseudoElement':
      return { text: `::${node.name}`, axis: 'c', label: 'pseudo-element', isCombinator: false }

    case 'TypeSelector': {
      const lower = node.name.toLowerCase()
      if (HTML_ELEMENTS.has(lower)) {
        return { text: node.name, axis: 'c', label: 'element', isCombinator: false }
      }
      // Custom elements require a hyphen per HTML spec
      if (node.name.includes('-')) {
        return { text: node.name, axis: 'c', label: 'custom element', isCombinator: false }
      }
      return { text: node.name, axis: 'unknown', label: 'unknown', isCombinator: false }
    }

    case 'UniversalSelector':
      return { text: '*', axis: 'zero', label: '', isCombinator: false }

    case 'PseudoClass': {
      const name = node.name.toLowerCase()

      if (ZERO_SPECIFICITY_PSEUDOS.has(name)) {
        const text = node.argument ? `:where(…)` : `:where`
        return { text, axis: 'zero', label: 'zero specificity', isCombinator: false }
      }

      const hasSelectorArg = node.argument && typeof node.argument !== 'string'
      const text = hasSelectorArg ? `:${name}(…)` : node.argument ? `:${name}(${node.argument})` : `:${name}`

      // :not/:is/:has — axis depends on their argument (shown separately or summarised)
      const isSelectorPseudo = ['not', 'is', 'has', 'matches'].includes(name)
      if (isSelectorPseudo) {
        return { text, axis: 'b', label: `${name}(…)`, isCombinator: false }
      }

      return { text, axis: 'b', label: 'pseudo-class', isCombinator: false }
    }
  }
}

function combinatorToToken(node: CombinatorNode): DisplayToken {
  const symbols: Record<string, string> = { ' ': '↓', '>': '>', '+': '+', '~': '~' }
  const labels: Record<string, string> = { ' ': 'descendant', '>': 'child', '+': 'adjacent', '~': 'sibling' }
  return {
    text: symbols[node.value] ?? node.value,
    axis: 'combinator',
    label: labels[node.value] ?? '',
    isCombinator: true,
  }
}

export function flattenAST(ast: SelectorListNode): DisplayToken[][] {
  return ast.selectors.map(flattenComplex)
}

function flattenComplex(node: ComplexSelectorNode): DisplayToken[] {
  const tokens: DisplayToken[] = []
  for (const part of node.parts) {
    if (part.type === 'Combinator') {
      tokens.push(combinatorToToken(part))
    } else {
      for (const simple of part.simples) {
        tokens.push(simpleToToken(simple))
      }
    }
  }
  return tokens
}
