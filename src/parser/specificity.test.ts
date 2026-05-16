import { describe, it, expect } from 'vitest'
import { analyse, compareSpecificity, extractSelectors, formatSpecificity } from './specificity'

describe('analyse — basic selectors', () => {
  it('universal selector contributes zero', () => {
    expect(analyse('*').specificity).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('type selector contributes (0,0,1)', () => {
    expect(analyse('div').specificity).toEqual({ a: 0, b: 0, c: 1 })
  })

  it('class selector contributes (0,1,0)', () => {
    expect(analyse('.foo').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })

  it('ID selector contributes (1,0,0)', () => {
    expect(analyse('#bar').specificity).toEqual({ a: 1, b: 0, c: 0 })
  })

  it('attribute selector contributes (0,1,0)', () => {
    expect(analyse('[type="text"]').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })

  it('pseudo-class contributes (0,1,0)', () => {
    expect(analyse(':hover').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })

  it('pseudo-element contributes (0,0,1)', () => {
    expect(analyse('::before').specificity).toEqual({ a: 0, b: 0, c: 1 })
  })
})

describe('analyse — combined selectors', () => {
  it('adds contributions across selector parts', () => {
    expect(analyse('#id .class div').specificity).toEqual({ a: 1, b: 1, c: 1 })
  })

  it('combinators do not add to the score', () => {
    expect(analyse('div > span').specificity).toEqual({ a: 0, b: 0, c: 2 })
    expect(analyse('ul li').specificity).toEqual({ a: 0, b: 0, c: 2 })
  })

  it('stacks multiple classes', () => {
    expect(analyse('.a.b.c').specificity).toEqual({ a: 0, b: 3, c: 0 })
  })
})

describe('analyse — functional pseudo-classes', () => {
  it(':where() always contributes zero', () => {
    expect(analyse(':where(.foo, #bar)').specificity).toEqual({ a: 0, b: 0, c: 0 })
  })

  it(':is() takes the max specificity of its arguments', () => {
    expect(analyse(':is(.foo, #bar)').specificity).toEqual({ a: 1, b: 0, c: 0 })
  })

  it(':not() takes the max specificity of its arguments', () => {
    expect(analyse(':not(#id)').specificity).toEqual({ a: 1, b: 0, c: 0 })
    expect(analyse(':not(.cls)').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })

  it(':has() takes the max specificity of its arguments', () => {
    expect(analyse(':has(img)').specificity).toEqual({ a: 0, b: 0, c: 1 })
    expect(analyse(':has(.active)').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })

  it(':nth-child(An+B of S) adds pseudo-class + max(S)', () => {
    // :nth-child = (0,1,0) + .active = (0,1,0) → (0,2,0)
    expect(analyse(':nth-child(2n+1 of .active)').specificity).toEqual({ a: 0, b: 2, c: 0 })
  })

  it(':nth-child without "of" clause is just (0,1,0)', () => {
    expect(analyse(':nth-child(2n+1)').specificity).toEqual({ a: 0, b: 1, c: 0 })
  })
})

describe('analyse — selector lists', () => {
  it('returns the max specificity across a comma-separated list', () => {
    // div (0,0,1) vs #id (1,0,0) — returns max
    expect(analyse('div, #id').specificity).toEqual({ a: 1, b: 0, c: 0 })
  })

  it('a single ID outweighs any number of classes', () => {
    const idSpec = analyse('#x').specificity
    const manyClasses = analyse('.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p').specificity
    expect(compareSpecificity(idSpec, manyClasses)).toBe(1)
  })
})

describe('analyse — error cases', () => {
  it('returns an error for at-rules', () => {
    expect(analyse('@media (max-width: 768px)').error).toBeDefined()
  })

  it('returns zero specificity alongside an error', () => {
    const result = analyse('@keyframes spin')
    expect(result.specificity).toEqual({ a: 0, b: 0, c: 0 })
    expect(result.error).toBeDefined()
  })
})

describe('compareSpecificity', () => {
  it('returns 1 when first is more specific (ID column)', () => {
    expect(compareSpecificity({ a: 1, b: 0, c: 0 }, { a: 0, b: 99, c: 99 })).toBe(1)
  })

  it('returns -1 when second is more specific', () => {
    expect(compareSpecificity({ a: 0, b: 0, c: 0 }, { a: 0, b: 1, c: 0 })).toBe(-1)
  })

  it('returns 0 for equal specificity', () => {
    expect(compareSpecificity({ a: 0, b: 2, c: 3 }, { a: 0, b: 2, c: 3 })).toBe(0)
  })

  it('breaks ties by the class column', () => {
    expect(compareSpecificity({ a: 0, b: 2, c: 0 }, { a: 0, b: 1, c: 5 })).toBe(1)
  })
})

describe('formatSpecificity', () => {
  it('formats as (a, b, c)', () => {
    expect(formatSpecificity({ a: 1, b: 2, c: 3 })).toBe('(1, 2, 3)')
  })

  it('formats zeros', () => {
    expect(formatSpecificity({ a: 0, b: 0, c: 0 })).toBe('(0, 0, 0)')
  })
})

describe('extractSelectors', () => {
  it('extracts a simple single-line selector', () => {
    const result = extractSelectors('.foo { color: red; }')
    expect(result).toEqual([{ selector: '.foo', line: 1 }])
  })

  it('extracts multiple selectors from a comma list on one line', () => {
    const result = extractSelectors('.foo, .bar { color: red; }')
    expect(result.map(r => r.selector)).toEqual(['.foo', '.bar'])
  })

  it('handles multi-line selector lists', () => {
    const css = '.foo,\n.bar {\n  color: red;\n}'
    const result = extractSelectors(css)
    expect(result.map(r => r.selector)).toEqual(['.foo', '.bar'])
  })

  it('records the start line of multi-line selectors', () => {
    const css = '.foo,\n.bar {\n  color: red;\n}'
    const result = extractSelectors(css)
    // Both selectors start accumulating from line 1
    expect(result[0].line).toBe(1)
  })

  it('tracks line numbers for later selectors', () => {
    const css = '\n\n.bar { color: blue; }'
    const result = extractSelectors(css)
    expect(result[0].line).toBe(3)
  })

  it('skips @keyframes blocks entirely', () => {
    const css = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
    expect(extractSelectors(css)).toEqual([])
  })

  it('skips @font-face blocks', () => {
    const css = '@font-face { font-family: "Foo"; src: url("foo.woff2"); }'
    expect(extractSelectors(css)).toEqual([])
  })

  it('extracts selectors nested inside @media blocks', () => {
    const css = '@media (max-width: 768px) {\n  .responsive { display: none; }\n}'
    const result = extractSelectors(css)
    expect(result.some(r => r.selector === '.responsive')).toBe(true)
  })

  it('throws when input exceeds the size limit', () => {
    const huge = 'a { color: red; } '.repeat(30_000)
    expect(() => extractSelectors(huge)).toThrow(/limit/)
  })
})
