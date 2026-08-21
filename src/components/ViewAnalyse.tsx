import { useState, useMemo } from 'react'
import { analyse } from '@/parser/specificity'
import { simpleToToken } from '@/parser/flatten'
import type { SelectorListNode, ComplexSelectorNode, CompoundSelectorNode, CombinatorNode } from '@/parser/types'
import { TOKEN_CHIP } from './tokenStyles'
import { cn } from '@/lib/utils'
import { ViewContainer } from '@kern/templates/ViewContainer'
import { ToolView } from '@kern/organisms/ToolView'
import { Field } from '@kern/molecules/Field'
import { Metric } from '@kern/molecules/Metric'
import { EmptyState } from '@kern/molecules/EmptyState'
import { Input } from '@kern/atoms/Input'
import { ToggleChip } from '@kern/atoms/ToggleChip'

const EXAMPLES = [
  'nav > ul li.active',
  '#header .logo::before',
  'input[type="email"]:focus',
  ':is(h1, h2, h3) + p',
  'a:not(.disabled):hover',
]

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
    <ViewContainer width="md">
      <ToolView
        title="Analyse a selector"
        description="Enter a single CSS selector to see its specificity score and breakdown."
        isEmpty={!hasInput}
        input={
          <Field label="Selector" error={hasError ? result?.error : undefined}>
            {(control) => (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                invalid={hasError}
                placeholder="e.g. nav > ul li.active:not([hidden])::before"
                spellCheck={false}
                autoComplete="off"
                {...control}
              />
            )}
          </Field>
        }
        empty={
          <EmptyState
            title="Try an example"
            actions={EXAMPLES.map((ex) => (
              <ToggleChip key={ex} active={false} onClick={() => setInput(ex)} mono>
                {ex}
              </ToggleChip>
            ))}
          >
            Or paste your own selector above.
          </EmptyState>
        }
      >
        {hasResult && result && (
          <div className="flex flex-col gap-6">
            {selectorCount > 1 && (
              <p className="type-annotation text-ink-muted">
                Highest specificity across {selectorCount} selectors
              </p>
            )}
            <div className="flex gap-3">
              <Metric label="[a] IDs"     value={result.specificity.a} className="flex-1" valueClassName="type-h4 font-mono text-solstice" />
              <Metric label="[b] classes" value={result.specificity.b} className="flex-1" valueClassName="type-h4 font-mono text-orbit" />
              <Metric label="[c] types"   value={result.specificity.c} className="flex-1" valueClassName="type-h4 font-mono text-supernova" />
            </div>
            <TreeBreakdown ast={result.ast} />
          </div>
        )}
      </ToolView>
    </ViewContainer>
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
