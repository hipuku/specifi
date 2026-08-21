import { useState, useMemo } from 'react'
import { analyse, compareSpecificity, formatSpecificity } from '@/parser/specificity'
import { flattenAST, type DisplayToken } from '@/parser/flatten'
import type { SpecificityResult } from '@/parser/types'
import { TOKEN_CHIP, AXIS_COLORS } from './tokenStyles'
import { cn } from '@/lib/utils'
import { ViewContainer } from '@kern/templates/ViewContainer'
import { ToolView } from '@kern/organisms/ToolView'
import { Field } from '@kern/molecules/Field'
import { CalloutCard } from '@kern/molecules/CalloutCard'
import { Input } from '@kern/atoms/Input'
import { InlineCode } from '@kern/atoms/InlineCode'

export function ViewCompare() {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')

  const resultA = useMemo(() => inputA.trim() ? analyse(inputA.trim()) : null, [inputA])
  const resultB = useMemo(() => inputB.trim() ? analyse(inputB.trim()) : null, [inputB])

  const comparison = useMemo(() => {
    if (!resultA || !resultB || resultA.error || resultB.error) return null
    return compareSpecificity(resultA.specificity, resultB.specificity)
  }, [resultA, resultB])

  const winner: 'a' | 'b' | 'tie' | null =
    comparison === 1 ? 'a' : comparison === -1 ? 'b' : comparison === 0 ? 'tie' : null

  return (
    <ViewContainer width="lg">
      <ToolView
        title="Compare two selectors"
        description="Enter two selectors to see which one wins and why."
        input={
          <div className="grid grid-cols-2 gap-4">
            <SelectorInput
              label="Selector A"
              value={inputA}
              onChange={setInputA}
              result={resultA}
              highlight={winner === 'a' ? 'win' : winner === 'tie' ? 'tie' : winner === 'b' ? 'lose' : null}
            />
            <SelectorInput
              label="Selector B"
              value={inputB}
              onChange={setInputB}
              result={resultB}
              highlight={winner === 'b' ? 'win' : winner === 'tie' ? 'tie' : winner === 'a' ? 'lose' : null}
            />
          </div>
        }
      >
        {winner !== null && (
          <Verdict winner={winner} resultA={resultA} resultB={resultB} />
        )}
      </ToolView>
    </ViewContainer>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type Highlight = 'win' | 'lose' | 'tie' | null

function SelectorInput({
  label, value, onChange, result, highlight,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  result: SpecificityResult | null
  highlight: Highlight
}) {
  const hasError = !!result?.error

  const tokens = useMemo(() => {
    if (!result || result.error || result.ast.selectors.length === 0) return []
    return flattenAST(result.ast)[0] ?? []
  }, [result])

  // Win/lose recolours the input border; error takes precedence via `invalid`.
  const highlightClass =
    highlight === 'win' ? 'border-supernova'
      : highlight === 'lose' ? 'border-line-strong'
        : ''

  return (
    <div className="flex flex-col gap-3">
      <Field label={label} error={hasError ? result?.error : undefined}>
        {(control) => (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={hasError}
            placeholder="e.g. .card > h2"
            spellCheck={false}
            autoComplete="off"
            className={cn(!hasError && highlightClass)}
            {...control}
          />
        )}
      </Field>

      {result && !hasError && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <MiniScore label="a" value={result.specificity.a} color={AXIS_COLORS.a} />
            <MiniScore label="b" value={result.specificity.b} color={AXIS_COLORS.b} />
            <MiniScore label="c" value={result.specificity.c} color={AXIS_COLORS.c} />
          </div>
          {tokens.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {tokens.map((tok, i) => <InlineToken key={`${tok.text}-${i}`} token={tok} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniScore({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1 rounded px-3 py-1 bg-void-20">
      <span className="type-code" style={{ color }}>{value}</span>
      <span className="type-annotation text-void-50">{label}</span>
    </div>
  )
}

function InlineToken({ token }: { token: DisplayToken }) {
  if (token.isCombinator) {
    return (
      <span className="type-annotation font-mono px-[2px] text-void-50">
        {token.text}
      </span>
    )
  }
  return (
    <code
      title={token.label}
      className={cn('type-annotation font-mono whitespace-nowrap rounded px-1.5 py-0.5', TOKEN_CHIP[token.axis] ?? TOKEN_CHIP.unknown)}
    >
      {token.text}
    </code>
  )
}

function Verdict({
  winner,
  resultA,
  resultB,
}: {
  winner: 'a' | 'b' | 'tie'
  resultA: SpecificityResult | null
  resultB: SpecificityResult | null
}) {
  if (winner === 'tie') {
    return (
      <CalloutCard colour="neutral">
        Both selectors have equal specificity{' '}
        <InlineCode colour="neutral" className="bg-void-30">
          {resultA ? formatSpecificity(resultA.specificity) : ''}
        </InlineCode>
        . Source order decides.
      </CalloutCard>
    )
  }

  const winResult = winner === 'a' ? resultA : resultB
  const loseResult = winner === 'a' ? resultB : resultA
  const winLabel = winner === 'a' ? 'Selector A' : 'Selector B'

  return (
    <CalloutCard colour="supernova" label={`${winLabel} wins`}>
      <InlineCode className="bg-supernova/15 text-supernova">
        {winResult ? formatSpecificity(winResult.specificity) : ''}
      </InlineCode>
      {' > '}
      <InlineCode colour="neutral" className="bg-void-30">
        {loseResult ? formatSpecificity(loseResult.specificity) : ''}
      </InlineCode>
    </CalloutCard>
  )
}
