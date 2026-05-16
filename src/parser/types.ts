// ─── Token types ──────────────────────────────────────────────────────────────

export type TokenType =
  | 'IDENT'
  | 'HASH'
  | 'DOT'
  | 'STAR'
  | 'COLON'
  | 'DOUBLE_COLON'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'COMBINATOR_CHILD'       // >
  | 'COMBINATOR_ADJACENT'    // +
  | 'COMBINATOR_SIBLING'     // ~
  | 'COMBINATOR_DESCENDANT'  // whitespace
  | 'ATTR_OPERATOR'          // = ~= |= ^= $= *=
  | 'STRING'
  | 'NUMBER'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  pos: number
}

// ─── AST node types ───────────────────────────────────────────────────────────

export type ASTNodeType =
  | 'SelectorList'
  | 'ComplexSelector'
  | 'CompoundSelector'
  | 'TypeSelector'
  | 'UniversalSelector'
  | 'ClassSelector'
  | 'IdSelector'
  | 'AttributeSelector'
  | 'PseudoClass'
  | 'PseudoElement'
  | 'Combinator'

export interface SelectorListNode {
  type: 'SelectorList'
  selectors: ComplexSelectorNode[]
}

export interface ComplexSelectorNode {
  type: 'ComplexSelector'
  parts: Array<CompoundSelectorNode | CombinatorNode>
}

export interface CompoundSelectorNode {
  type: 'CompoundSelector'
  simples: SimpleSelector[]
}

export interface CombinatorNode {
  type: 'Combinator'
  value: '>' | '+' | '~' | ' '
}

export type SimpleSelector =
  | TypeSelectorNode
  | UniversalSelectorNode
  | ClassSelectorNode
  | IdSelectorNode
  | AttributeSelectorNode
  | PseudoClassNode
  | PseudoElementNode

export interface TypeSelectorNode {
  type: 'TypeSelector'
  name: string
}

export interface UniversalSelectorNode {
  type: 'UniversalSelector'
}

export interface ClassSelectorNode {
  type: 'ClassSelector'
  name: string
}

export interface IdSelectorNode {
  type: 'IdSelector'
  name: string
}

export interface AttributeSelectorNode {
  type: 'AttributeSelector'
  attribute: string
  operator?: string
  value?: string
}

export interface PseudoClassNode {
  type: 'PseudoClass'
  name: string
  // For functional pseudos: :not(), :is(), :has(), :where(), :nth-child(), etc.
  argument?: SelectorListNode | string
}

export interface PseudoElementNode {
  type: 'PseudoElement'
  name: string
}

// ─── Specificity ──────────────────────────────────────────────────────────────

export interface Specificity {
  a: number  // IDs
  b: number  // classes, attributes, pseudo-classes
  c: number  // elements, pseudo-elements
}

export interface SpecificityResult {
  selector: string
  specificity: Specificity
  ast: SelectorListNode
  error?: string
}

// Functional pseudo-classes whose argument specificity replaces their own
export const SELECTOR_PSEUDOS = new Set(['not', 'is', 'has', 'matches', 'nth-child', 'nth-last-child'])
// Zero-specificity pseudo-classes
export const ZERO_SPECIFICITY_PSEUDOS = new Set(['where'])
