import { useState, useMemo } from 'react'
import { analyse, compareSpecificity, formatSpecificity, extractSelectors } from '@/parser/specificity'
import { AXIS_COLORS } from './tokenStyles'
import { cn } from '@/lib/utils'

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

      {/* ── Title ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-h4 font-semibold text-void-90">Rank a stylesheet</h1>
        <p className="text-p-sm text-void-60">
          Paste any CSS below. All selectors are extracted, deduplicated, and sorted by specificity.
        </p>
      </div>

      {/* ── Textarea ── */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="css-input"
          className="text-annotation text-void-60 uppercase tracking-[0.08em]"
        >
          CSS
        </label>
        <textarea
          id="css-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={10}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="font-mono text-annotation text-void-80 bg-void-10 rounded-[10px] px-4 py-3 w-full outline-none resize-y leading-[1.7] transition-colors duration-150 border border-void-20 focus:border-void-40"
        />
      </div>

      {/* ── Results ── */}
      {hasInput && ranked.length === 0 && (
        <p className="text-p-sm text-void-50">
          No selectors found. Make sure your CSS contains rules like{' '}
          <code className="font-mono text-code text-orbit">.class {'{ }'}</code>.
        </p>
      )}

      {ranked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-annotation text-void-50 uppercase tracking-[0.08em]">
            {ranked.length} selector{ranked.length !== 1 ? 's' : ''} — ranked highest first
          </p>

          <div className="rounded-xl overflow-hidden border border-void-20">
            {ranked.map((entry, i) => (
              <RankRow key={`${entry.selector}-${i}`} entry={entry} rank={i + 1} total={ranked.length} />
            ))}
          </div>
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
        'flex items-center gap-4 px-4 py-3 transition-colors duration-150',
        !isLast && 'border-b border-void-20',
        rank === 1 ? 'bg-void-20' : 'bg-void-10 hover:bg-void-20',
      )}
    >
      <span
        className={cn(
          'font-mono text-annotation min-w-8 text-right',
          rank === 1 ? 'text-supernova' : 'text-void-40',
        )}
      >
        {rank}
      </span>

      <code
        className={cn('flex-1 truncate font-mono text-annotation', entry.error ? 'text-flare' : 'text-void-80')}
        title={entry.selector}
      >
        {entry.selector}
      </code>

      {!entry.error && (
        <div className="flex items-center gap-2 shrink-0">
          <SpecChip value={entry.a} color={AXIS_COLORS.a} label="a" />
          <SpecChip value={entry.b} color={AXIS_COLORS.b} label="b" />
          <SpecChip value={entry.c} color={AXIS_COLORS.c} label="c" />
          <span className="font-mono text-annotation text-void-50 min-w-[72px] text-right">
            {spec}
          </span>
        </div>
      )}

      {entry.error && (
        <span className="text-annotation text-flare">parse error</span>
      )}

      <span className="text-annotation text-void-40 min-w-[3rem] text-right font-mono">
        :{entry.line}
      </span>
    </div>
  )
}

function SpecChip({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 rounded px-2 bg-void-20 min-w-[2.2rem]">
      <span className="font-mono text-annotation" style={{ color }}>{value}</span>
      <span className="text-[0.65rem] text-void-50">{label}</span>
    </div>
  )
}

const PLACEHOLDER = `.nav-link { color: blue; }
.nav-link:hover { color: red; }
#main-nav .nav-link { color: green; }
a { color: inherit; }
a:not(.disabled):hover { color: purple; }
.card > h2 + p::first-line { font-style: italic; }`
