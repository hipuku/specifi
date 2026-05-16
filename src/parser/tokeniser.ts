import type { Token } from './types'

export function tokenise(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    // Whitespace — only significant as a descendant combinator between compounds
    if (/\s/.test(ch)) {
      let j = i
      while (j < input.length && /\s/.test(input[j])) j++
      // Emit descendant combinator only if flanked by non-combinator content
      // (we'll handle the flanking check in the parser; emit it unconditionally)
      tokens.push({ type: 'COMBINATOR_DESCENDANT', value: ' ', pos: i })
      i = j
      continue
    }

    // Comments /* ... */ — skip entirely
    if (ch === '/' && input[i + 1] === '*') {
      i += 2
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++
      i += 2
      continue
    }

    if (ch === '#') {
      i++
      const start = i
      while (i < input.length && /[\w-]/.test(input[i])) i++
      tokens.push({ type: 'HASH', value: input.slice(start, i), pos: start - 1 })
      continue
    }

    if (ch === '.') {
      tokens.push({ type: 'DOT', value: '.', pos: i })
      i++
      continue
    }

    if (ch === '*') {
      if (input[i + 1] === '=') {
        tokens.push({ type: 'ATTR_OPERATOR', value: '*=', pos: i })
        i += 2
      } else {
        tokens.push({ type: 'STAR', value: '*', pos: i })
        i++
      }
      continue
    }

    if (ch === ':') {
      if (input[i + 1] === ':') {
        tokens.push({ type: 'DOUBLE_COLON', value: '::', pos: i })
        i += 2
      } else {
        tokens.push({ type: 'COLON', value: ':', pos: i })
        i++
      }
      continue
    }

    if (ch === '[') {
      tokens.push({ type: 'LBRACKET', value: '[', pos: i })
      i++
      continue
    }

    if (ch === ']') {
      tokens.push({ type: 'RBRACKET', value: ']', pos: i })
      i++
      continue
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i })
      i++
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i })
      i++
      continue
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', pos: i })
      i++
      continue
    }

    if (ch === '>') {
      tokens.push({ type: 'COMBINATOR_CHILD', value: '>', pos: i })
      i++
      continue
    }

    if (ch === '+') {
      tokens.push({ type: 'COMBINATOR_ADJACENT', value: '+', pos: i })
      i++
      continue
    }

    if (ch === '~') {
      if (input[i + 1] === '=') {
        tokens.push({ type: 'ATTR_OPERATOR', value: '~=', pos: i })
        i += 2
      } else {
        tokens.push({ type: 'COMBINATOR_SIBLING', value: '~', pos: i })
        i++
      }
      continue
    }

    // Attribute operators: |= ^= $=
    if ((ch === '|' || ch === '^' || ch === '$') && input[i + 1] === '=') {
      tokens.push({ type: 'ATTR_OPERATOR', value: ch + '=', pos: i })
      i += 2
      continue
    }

    if (ch === '=') {
      tokens.push({ type: 'ATTR_OPERATOR', value: '=', pos: i })
      i++
      continue
    }

    // Strings inside attribute selectors
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      const start = i
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\') i++ // skip escaped char
        i++
      }
      tokens.push({ type: 'STRING', value: input.slice(start, i), pos: start })
      i++ // closing quote
      continue
    }

    // Identifiers: element names, class names, pseudo names, attribute names
    if (/[a-zA-Z_\-\\]/.test(ch) || (ch === '-' && i + 1 < input.length && /[a-zA-Z_]/.test(input[i + 1]))) {
      const start = i
      while (i < input.length && /[\w\-]/.test(input[i])) i++
      tokens.push({ type: 'IDENT', value: input.slice(start, i), pos: start })
      continue
    }

    // Numbers (used in nth expressions like 2n+1)
    if (/\d/.test(ch) || (ch === '-' && /\d/.test(input[i + 1] ?? ''))) {
      const start = i
      if (ch === '-') i++
      while (i < input.length && /[\d]/.test(input[i])) i++
      // handle 2n, 2n+1 etc — keep as part of the raw string consumed by parser
      tokens.push({ type: 'NUMBER', value: input.slice(start, i), pos: start })
      continue
    }

    // Skip unknown characters
    i++
  }

  tokens.push({ type: 'EOF', value: '', pos: i })
  return tokens
}
