import { useState, useMemo } from 'react'
import { analyse } from '@/parser/specificity'
import { simpleToToken } from '@/parser/flatten'
import type { SelectorListNode, ComplexSelectorNode, CompoundSelectorNode, CombinatorNode } from '@/parser/types'
import { TOKEN_CHIP, AXIS_COLORS } from './tokenStyles'
import { cn } from '@/lib/utils'
import { ViewHeader } from '@kern/molecules/ViewHeader'

export function ViewAnalyse() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return null
    return analyse(trimmed)
  }, [input])

  const hasInput = input.trim().length > 0
  const hasError = hasInput && !!result?.error
  const hasResult = hasInput && !hasError && (result?.ast.selectors.length ?? 0) > 0
  const selectorCount = result?.ast.selectors.length ?? 0

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">

      <ViewHeader
        title="Analyse a selector"
        description="Enter a single CSS selector to see its specificity score and breakdown."
      />

      {/* ── Input ── */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="selector-input"
          className="type-annotation-sc text-void-60"
        >
          Selector
        </label>
        <input
          id="selector-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. nav > ul li.active:not([hidden])::before"
          spellCheck={false}
          autoComplete="off"
          className={cn(
            'type-code bg-void-10 rounded-xl px-4 py-3 w-full outline-none transition-colors duration-150 border placeholder:text-void-40',
            hasError
              ? 'border-flare text-flare'
              : 'border-void-20 text-void-90 focus:border-void-40',
          )}
        />
        {hasError && (
          <p className="type-annotation text-flare">{result?.error}</p>
        )}
      </div>

      {/* ── Results ── */}
      {hasResult && result && (
        <div className="flex flex-col gap-6">
          {selectorCount > 1 && (
            <p className="type-annotation text-void-50">
              Highest specificity across {selectorCount} selectors
            </p>
          )}
          <div className="flex gap-3">
            <ScoreCard label="[a] IDs"     value={result.specificity.a} color={AXIS_COLORS.a} />
            <ScoreCard label="[b] classes" value={result.specificity.b} color={AXIS_COLORS.b} />
            <ScoreCard label="[c] types"   value={result.specificity.c} color={AXIS_COLORS.c} />
          </div>
          <TreeBreakdown ast={result.ast} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasInput && <EmptyHint onSelect={setInput} />}
    </div>
  )
}

// ─── Score card ────────────────────────────────────────────────────────────────

function ScoreCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-5 flex-1 bg-void-20 border border-void-30">
      <span className="type-h4 font-mono" style={{ color }}>
        {value}
      </span>
      <span className="type-annotation-sc text-void-60">
        {label}
      </span>
    </div>
  )
}

// ─── Tree breakdown ────────────────────────────────────────────────────────────

function TreeBreakdown({ ast }: { ast: SelectorListNode }) {
  return (
    <div className="flex flex-col gap-6">
      {ast.selectors.map((complex, i) => (
        <div key={i} className="flex flex-col gap-0">
          {ast.selectors.length > 1 && (
            <p className="type-annotation text-void-50 mb-2">Selector {i + 1}</p>
          )}
          <ComplexTree node={complex} />
        </div>
      ))}
    </div>
  )
}

function ComplexTree({ node }: { node: ComplexSelectorNode }) {
  return (
    <div className="flex flex-col">
      {node.parts.map((part, i) =>
        part.type === 'Combinator'
          ? <CombinatorBridge key={i} node={part as CombinatorNode} />
          : <CompoundBlock key={i} node={part as CompoundSelectorNode} />
      )}
    </div>
  )
}

// ─── Combinator connector ──────────────────────────────────────────────────────

const COMBINATOR_META: Record<string, { symbol: string; label: string }> = {
  '>': { symbol: '›',  label: 'child' },
  '+': { symbol: '+',  label: 'adjacent sibling' },
  '~': { symbol: '~',  label: 'general sibling' },
  ' ': { symbol: '↓',  label: 'descendant' },
}

function CombinatorBridge({ node }: { node: CombinatorNode }) {
  const meta = COMBINATOR_META[node.value] ?? { symbol: node.value, label: '' }
  return (
    <div className="flex items-center gap-3 py-[5px] px-[14px]">
      <div className="w-px h-[18px] bg-void-30 ml-[7px] shrink-0" />
      <span className="type-annotation font-mono text-void-50">{meta.symbol}</span>
      <span className="type-annotation text-void-50">
        {meta.label}
      </span>
    </div>
  )
}

// ─── Compound block ────────────────────────────────────────────────────────────


function CompoundBlock({ node }: { node: CompoundSelectorNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-void-20 bg-void-10">
      {node.simples.map((simple, i) => {
        const token = simpleToToken(simple)
        const isLast = i === node.simples.length - 1
        const isAxised = token.axis === 'a' || token.axis === 'b' || token.axis === 'c'
        const isUnknown = token.axis === 'unknown'

        return (
          <div
            key={i}
            className={cn('flex items-center gap-4 px-[14px] py-[9px]', !isLast && 'border-b border-void-20')}
          >
            <code className={cn(
              'type-annotation font-mono px-1.5 py-0.5 rounded shrink-0',
              TOKEN_CHIP[token.axis] ?? TOKEN_CHIP.unknown,
            )}>
              {token.text}
            </code>
            {token.label && (
              <span className="type-annotation text-void-60 flex-1">
                {token.label}
              </span>
            )}
            {isAxised && (
              <span className={cn('type-annotation font-mono px-1.5 py-0.5 rounded', TOKEN_CHIP[token.axis])}>
                {token.axis}
              </span>
            )}
            {isUnknown && (
              <span className="type-annotation font-mono text-void-40 bg-void-30/50 px-1.5 py-0.5 rounded">0</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Empty hint ────────────────────────────────────────────────────────────────

function EmptyHint({ onSelect }: { onSelect: (val: string) => void }) {
  const examples = [
    'nav > ul li.active',
    '#header .logo::before',
    'input[type="email"]:focus',
    ':is(h1, h2, h3) + p',
    'a:not(.disabled):hover',
  ]
  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="type-p-sm text-void-60">Try an example</p>
      <div className="flex flex-wrap gap-2">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => onSelect(ex)}
            className="type-annotation font-mono bg-void-10 rounded-lg px-[10px] py-1 cursor-pointer transition-colors duration-150 border border-void-20 text-void-60 hover:text-void-90 hover:border-void-40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
