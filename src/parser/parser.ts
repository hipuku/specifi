import { tokenise } from './tokeniser'
import type {
  Token,
  SelectorListNode,
  ComplexSelectorNode,
  CompoundSelectorNode,
  CombinatorNode,
  SimpleSelector,
  PseudoClassNode,
  AttributeSelectorNode,
} from './types'

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(input: string) {
    this.tokens = tokenise(input)
    this.pos = 0
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  private expect(type: Token['type']): Token {
    const t = this.consume()
    if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type} ("${t.value}")`)
    return t
  }

  private skipWhitespace() {
    while (this.peek().type === 'COMBINATOR_DESCENDANT') this.pos++
  }

  // ─── Selector list ──────────────────────────────────────────────────────────

  parseSelectorList(): SelectorListNode {
    this.skipWhitespace()
    const selectors: ComplexSelectorNode[] = [this.parseComplexSelector()]

    while (this.peek().type === 'COMMA') {
      this.consume() // ,
      this.skipWhitespace()
      selectors.push(this.parseComplexSelector())
    }

    return { type: 'SelectorList', selectors }
  }

  // ─── Complex selector ───────────────────────────────────────────────────────

  private parseComplexSelector(): ComplexSelectorNode {
    const parts: Array<CompoundSelectorNode | CombinatorNode> = []
    parts.push(this.parseCompoundSelector())

    while (true) {
      const next = this.peek()

      if (
        next.type === 'EOF' ||
        next.type === 'COMMA' ||
        next.type === 'RPAREN'
      ) break

      // Explicit combinators
      if (
        next.type === 'COMBINATOR_CHILD' ||
        next.type === 'COMBINATOR_ADJACENT' ||
        next.type === 'COMBINATOR_SIBLING'
      ) {
        const tok = this.consume()
        this.skipWhitespace()
        const combValue = tok.value
        if (combValue !== '>' && combValue !== '+' && combValue !== '~') {
          throw new Error(`Unexpected combinator token value: "${combValue}"`)
        }
        parts.push({ type: 'Combinator', value: combValue })
        parts.push(this.parseCompoundSelector())
        continue
      }

      // Descendant combinator — whitespace followed by a compound selector start
      if (next.type === 'COMBINATOR_DESCENDANT') {
        // Peek ahead past whitespace to see if a compound selector follows
        let ahead = this.pos + 1
        while (ahead < this.tokens.length && this.tokens[ahead].type === 'COMBINATOR_DESCENDANT') ahead++
        // Guard: tokeniser always appends EOF but clamp anyway
        const after = this.tokens[Math.min(ahead, this.tokens.length - 1)]
        if (
          after.type === 'EOF' ||
          after.type === 'COMMA' ||
          after.type === 'RPAREN'
        ) break
        // Check if next non-whitespace is an explicit combinator — if so, skip whitespace only
        if (
          after.type === 'COMBINATOR_CHILD' ||
          after.type === 'COMBINATOR_ADJACENT' ||
          after.type === 'COMBINATOR_SIBLING'
        ) {
          this.skipWhitespace()
          continue
        }
        this.skipWhitespace()
        parts.push({ type: 'Combinator', value: ' ' })
        parts.push(this.parseCompoundSelector())
        continue
      }

      break
    }

    return { type: 'ComplexSelector', parts }
  }

  // ─── Compound selector ──────────────────────────────────────────────────────

  private parseCompoundSelector(): CompoundSelectorNode {
    const simples: SimpleSelector[] = []

    while (true) {
      const next = this.peek()

      if (next.type === 'STAR') {
        this.consume()
        simples.push({ type: 'UniversalSelector' })
        continue
      }

      if (next.type === 'IDENT') {
        this.consume()
        simples.push({ type: 'TypeSelector', name: next.value })
        continue
      }

      if (next.type === 'HASH') {
        this.consume()
        simples.push({ type: 'IdSelector', name: next.value })
        continue
      }

      if (next.type === 'DOT') {
        this.consume()
        const name = this.expect('IDENT')
        simples.push({ type: 'ClassSelector', name: name.value })
        continue
      }

      if (next.type === 'LBRACKET') {
        simples.push(this.parseAttributeSelector())
        continue
      }

      if (next.type === 'DOUBLE_COLON') {
        this.consume()
        const name = this.expect('IDENT')
        // Consume optional () for functional pseudo-elements like ::slotted()
        if (this.peek().type === 'LPAREN') {
          this.consume()
          this.consumeUntilCloseParen()
        }
        simples.push({ type: 'PseudoElement', name: name.value })
        continue
      }

      if (next.type === 'COLON') {
        simples.push(this.parsePseudoClass())
        continue
      }

      break
    }

    if (simples.length === 0) {
      throw new Error(`Expected a simple selector at position ${this.peek().pos}`)
    }

    return { type: 'CompoundSelector', simples }
  }

  // ─── Attribute selector ─────────────────────────────────────────────────────

  private parseAttributeSelector(): AttributeSelectorNode {
    this.expect('LBRACKET')
    this.skipWhitespace()
    const attr = this.expect('IDENT')
    this.skipWhitespace()

    const next = this.peek()
    if (next.type === 'RBRACKET') {
      this.consume()
      return { type: 'AttributeSelector', attribute: attr.value }
    }

    if (next.type === 'ATTR_OPERATOR') {
      const op = this.consume()
      this.skipWhitespace()
      const valTok = this.peek()
      let value = ''
      if (valTok.type === 'STRING' || valTok.type === 'IDENT') {
        value = this.consume().value
      }
      this.skipWhitespace()
      // optional case flag i or s
      if (this.peek().type === 'IDENT') this.consume()
      this.expect('RBRACKET')
      return { type: 'AttributeSelector', attribute: attr.value, operator: op.value, value }
    }

    this.expect('RBRACKET')
    return { type: 'AttributeSelector', attribute: attr.value }
  }

  // ─── Pseudo-class ───────────────────────────────────────────────────────────

  private parsePseudoClass(): PseudoClassNode {
    this.expect('COLON')
    const name = this.expect('IDENT')

    // Non-functional pseudo-class
    if (this.peek().type !== 'LPAREN') {
      return { type: 'PseudoClass', name: name.value }
    }

    // Functional pseudo-class
    this.consume() // (

    const pseudoName = name.value.toLowerCase()

    // Pseudo-classes that take a selector list as argument
    const selectorArgPseudos = new Set(['not', 'is', 'has', 'where', 'matches'])
    const nthSelectorPseudos = new Set(['nth-child', 'nth-last-child'])

    if (selectorArgPseudos.has(pseudoName)) {
      this.skipWhitespace()
      const argList = this.parseSelectorList()
      this.skipWhitespace()
      if (this.peek().type === 'RPAREN') this.consume()
      return { type: 'PseudoClass', name: pseudoName, argument: argList }
    }

    if (nthSelectorPseudos.has(pseudoName)) {
      // nth-child(2n+1 of .class) — consume the An+B part, then optionally "of <selector-list>"
      const rawArg = this.consumeNthArgument()
      this.skipWhitespace()
      // Check for "of <selector-list>"
      if (this.peek().type === 'IDENT' && this.peek().value === 'of') {
        this.consume()
        this.skipWhitespace()
        const argList = this.parseSelectorList()
        this.skipWhitespace()
        if (this.peek().type === 'RPAREN') this.consume()
        return { type: 'PseudoClass', name: pseudoName, argument: argList }
      }
      if (this.peek().type === 'RPAREN') this.consume()
      return { type: 'PseudoClass', name: pseudoName, argument: rawArg }
    }

    // Other functional pseudo-classes (:lang(), :dir(), :host(), etc.)
    const raw = this.consumeUntilCloseParen()
    return { type: 'PseudoClass', name: pseudoName, argument: raw }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private consumeNthArgument(): string {
    let raw = ''
    while (
      this.peek().type !== 'RPAREN' &&
      this.peek().type !== 'EOF' &&
      !(this.peek().type === 'IDENT' && this.peek().value === 'of')
    ) {
      raw += this.consume().value
    }
    return raw.trim()
  }

  private consumeUntilCloseParen(): string {
    let depth = 1
    let raw = ''
    while (depth > 0 && this.peek().type !== 'EOF') {
      const t = this.consume()
      if (t.type === 'LPAREN') depth++
      else if (t.type === 'RPAREN') {
        depth--
        if (depth === 0) break
      }
      raw += t.value
    }
    return raw.trim()
  }
}

export function parse(selector: string): SelectorListNode {
  const parser = new Parser(selector.trim())
  return parser.parseSelectorList()
}
