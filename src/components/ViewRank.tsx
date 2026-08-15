import { useState, useMemo } from 'react'
import { analyse, compareSpecificity, formatSpecificity, extractSelectors } from '@/parser/specificity'
import { AXIS_COLORS } from './tokenStyles'
import { cn } from '@/lib/utils'
import { ViewHeader } from '@kern/molecules/ViewHeader'
import { InlineCode } from '@kern/atoms/InlineCode'

interface RankedEntry {
  selector: string
  line: number
  a: number
  b: number
  c: number
  error?: string
}

export function ViewRank() {
  const [input, setInput] = useState('')

  const ranked = useMemo<RankedEntry[]>(() => {
    if (!input.trim()) return []

    const extracted = extractSelectors(input)

    const seen = new Set<string>()
    const unique = extracted.filter(({ selector }) => {
      if (seen.has(selector)) return false
      seen.add(selector)
      return true
    })

    return unique
      .map(({ selector, line }) => {
        const result = analyse(selector)
        return {
          selector,
          line,
          a: result.specificity.a,
          b: result.specificity.b,
          c: result.specificity.c,
          error: result.error,
        }
      })
      .sort((x, y) =>
        -compareSpecificity(
          { a: x.a, b: x.b, c: x.c },
          { a: y.a, b: y.b, c: y.c },
        )
      )
  }, [input])

  const hasInput = input.trim().length > 0

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">

      <ViewHeader
        title="Rank a stylesheet"
        description="Paste any CSS below. All selectors are extracted, deduplicated, and sorted by specificity."
      />

      {/* ── Textarea ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="css-input" className="type-annotation-sc text-void-60">
            CSS
          </label>
          {ranked.length > 0 && (
            <span className="type-annotation text-void-50">
              {ranked.length} selector{ranked.length !== 1 ? 's' : ''}, ranked highest first
            </span>
          )}
        </div>
        <textarea
          id="css-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={10}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="type-code w-full bg-void-10 border border-void-20 focus:border-void-40 rounded-xl px-4 py-3 text-void-90 placeholder:text-void-40 outline-none resize-y transition-colors duration-150"
        />
      </div>

      {/* ── Results ── */}
      {hasInput && ranked.length === 0 && (
        <p className="type-p-sm text-void-60">
          No selectors found. Make sure your CSS contains rules like{' '}
          <InlineCode colour="text-orbit">.class {'{ }'}</InlineCode>.
        </p>
      )}

      {ranked.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-void-20">
          {ranked.map((entry, i) => (
            <RankRow key={entry.selector} entry={entry} rank={i + 1} total={ranked.length} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RankRow({ entry, rank, total }: { entry: RankedEntry; rank: number; total: number }) {
  const isLast = rank === total
  const spec = formatSpecificity({ a: entry.a, b: entry.b, c: entry.c })

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3',
        !isLast && 'border-b border-void-20',
      )}
    >
      <span
        className={cn(
          'type-annotation font-mono shrink-0',
          rank === 1 ? 'text-supernova' : 'text-void-40',
        )}
      >
        {rank}
      </span>

      <span
        className={cn('flex-1 min-w-0 truncate type-annotation font-mono', entry.error ? 'text-flare' : 'text-void-60')}
        title={entry.selector}
      >
        {entry.selector}
      </span>

      {!entry.error && (
        <div className="flex items-center gap-2 shrink-0">
          <SpecChip value={entry.a} color={AXIS_COLORS.a} label="a" />
          <SpecChip value={entry.b} color={AXIS_COLORS.b} label="b" />
          <SpecChip value={entry.c} color={AXIS_COLORS.c} label="c" />
          <span className="type-annotation font-mono text-void-60 min-w-[72px] text-right">
            {spec}
          </span>
        </div>
      )}

      {entry.error && (
        <span className="type-annotation text-flare">parse error</span>
      )}

      <span className="type-annotation font-mono text-void-50 min-w-[3rem] text-right">
        :{entry.line}
      </span>
    </div>
  )
}

function SpecChip({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 min-w-[2.2rem]">
      <span className="type-annotation font-mono" style={{ color }}>{value}</span>
      <span className="type-annotation text-void-50">{label}</span>
    </div>
  )
}

const PLACEHOLDER = `.nav-link { color: blue; }
.nav-link:hover { color: red; }
#main-nav .nav-link { color: green; }
a { color: inherit; }
a:not(.disabled):hover { color: purple; }
.card > h2 + p::first-line { font-style: italic; }`
