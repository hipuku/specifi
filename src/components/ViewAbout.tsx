import type { ReactNode } from 'react'
import { Section } from '@kern/molecules/Section'
import { BulletItem } from '@kern/atoms/BulletItem'
import { InlineCode } from '@kern/atoms/InlineCode'

export function ViewAbout() {
  return (
    <div className="flex flex-col gap-12 max-w-3xl mx-auto w-full">

      {/* ── Title + intro ── */}
      <div className="flex flex-col gap-3">
        <h1 className="type-h4 text-void-90">
          How CSS decides which style wins
        </h1>
        <p className="type-p-sm text-void-60">
          When two rules target the same element, the browser uses a scoring algorithm called{' '}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-solstice underline underline-offset-[3px]"
          >
            specificity
          </a>{' '}
          to decide which one takes effect. Defined in the CSS Selectors spec, it is a three part
          score <C>(a, b, c)</C> — IDs, classes and elements — compared left to right.
        </p>
      </div>

      {/* ── How it works ── */}
      <Section title="How it works">
        <div className="rounded-xl px-6 py-4 flex items-center justify-center bg-void-20 border border-void-30">
          <code className="type-code font-semibold">
            <span className="text-solstice">#app</span>
            {' '}
            <span className="text-orbit">.card:hover</span>
            {' '}
            <span className="text-supernova">button</span>
          </code>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ScoreBar axis="[a]" label="ID"    count={1} bg="var(--color-solstice)"  />
          <ScoreBar axis="[b]" label="CLASS" count={2} bg="var(--color-orbit)"     />
          <ScoreBar axis="[c]" label="TYPE"  count={1} bg="var(--color-supernova)" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <AxisCard title="ID selectors" examples="#header  #nav" exampleColor="var(--color-solstice)">
            Each <span className="font-mono text-solstice">#id</span> adds
            to the first column. Even a single ID outweighs any number of classes.
          </AxisCard>
          <AxisCard
            title="Classes, attributes, pseudo-classes"
            examples=".btn,  :focus,  [type]"
            exampleColor="var(--color-orbit)"
          >
            Each <span className="font-mono text-orbit">.class</span>,{' '}
            <span className="font-mono text-orbit">[attr]</span>, or{' '}
            <span className="font-mono text-orbit">:hover</span> adds
            1 to the second column.
          </AxisCard>
          <AxisCard
            title="Type selectors & pseudo-elements"
            examples="div,  span,  ::after"
            exampleColor="var(--color-supernova)"
          >
            Each element tag like{' '}
            <span className="font-mono text-supernova">p</span>,{' '}
            <span className="font-mono text-supernova">h1</span>, or{' '}
            <span className="font-mono text-supernova">::before</span> adds
            1 to the third column.
          </AxisCard>
        </div>
      </Section>

      {/* ── How comparison works ── */}
      <Section title="How comparison works">
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          <BulletItem>
            Columns are compared left to right with ID being first. A score of <C>1-0-0</C> always
            beats <C>0-99-99</C>, because the first column wins outright.
          </BulletItem>
          <BulletItem>
            If the first column ties, move to the second (class). If that ties too, the third
            (type) decides the winner.
          </BulletItem>
          <BulletItem>
            If all three columns are equal, the declaration that appears last in the stylesheet wins.
          </BulletItem>
          <BulletItem>
            Inline styles (<C>{'style="…"'}</C> on an element) override all selector-based rules,
            regardless of specificity score. Think of them as a fourth, unreachable column.
          </BulletItem>
          <BulletItem>
            Combinators like <C>{'>'}</C>, <C>+</C>, and <C>~</C> don't add to the score, only the
            selector components themselves count.
          </BulletItem>
          <BulletItem>
            <C>*</C> and <C>:where()</C> contribute zero to all three columns. They still match
            elements, they just never tip the score in a tie.
          </BulletItem>
          <BulletItem>
            <C>!important</C> bypasses specificity entirely. It doesn't raise your score, it exits
            the algorithm. The only way to override it is another <C>!important</C> with higher
            specificity, which is how specificity wars start. Use it as a last resort.
          </BulletItem>
        </ul>
      </Section>

      {/* ── Selector types table ── */}
      <Section title="Selector types">
        <ReferenceTable
          columns={['Pattern', 'Type', 'Axis', 'Example']}
          rows={[
            ['#name',        'ID selector',           'a', '#header'],
            ['.name',        'Class selector',        'b', '.card'],
            ['[attr]',       'Attribute (present)',   'b', '[disabled]'],
            ['[attr=val]',   'Attribute (exact)',     'b', '[type="text"]'],
            ['[attr~=val]',  'Attribute (word)',      'b', '[class~="btn"]'],
            ['[attr|=val]',  'Attribute (dash)',      'b', '[lang|="en"]'],
            ['[attr^=val]',  'Attribute (prefix)',    'b', '[href^="https"]'],
            ['[attr$=val]',  'Attribute (suffix)',    'b', '[src$=".png"]'],
            ['[attr*=val]',  'Attribute (contains)',  'b', '[title*="tip"]'],
            [':pseudo',      'Pseudo-class',          'b', ':hover, :focus'],
            [':not(S)',      'Negation — max(S)',     'b', ':not(.active)'],
            [':is(S)',       'Matches — max(S)',      'b', ':is(h1, h2)'],
            [':has(S)',      'Relational — max(S)',   'b', ':has(> img)'],
            [':where(S)',    'Zero-specificity',      '0', ':where(.card)'],
            ['element',      'Type selector',         'c', 'div, span'],
            ['custom-el',    'Custom element',        'c', 'my-button'],
            ['::pseudo',     'Pseudo-element',        'c', '::before'],
            ['*',            'Universal selector',    '0', '* { }'],
          ]}
        />
      </Section>

      {/* ── Combinators ── */}
      <Section title="Combinators — no specificity contribution">
        <p className="type-p-sm text-void-60">
          Combinators describe relationships between selectors. They never add to the score.
        </p>
        <ReferenceTable
          columns={['Symbol', 'Name', 'Meaning']}
          rows={[
            ['(space)', 'Descendant',       'Any depth inside'],
            ['>',       'Child',            'Direct child only'],
            ['+',       'Adjacent',         'Immediately after'],
            ['~',       'General sibling',  'Any sibling after'],
          ]}
        />
      </Section>

      {/* ── nth-child of S ── */}
      <Section title="nth-child with selector argument">
        <p className="type-p-sm text-void-60">
          <C>:nth-child(An+B of S)</C> and <C>:nth-last-child(An+B of S)</C> score as{' '}
          <C>(0,1,0)</C> for the pseudo-class itself <em>plus</em> the max specificity of the
          selector argument <C>S</C>.
        </p>
      </Section>

      {/* ── Outside the algorithm ── */}
      <Section title="Outside the algorithm">
        <div className="flex flex-col gap-3">
          <InfoRow
            label="Inline styles"
            detail='style="color: red"'
            note="Beats any selector — treated as (1,0,0,0), a fourth column above IDs."
          />
          <InfoRow
            label="!important"
            detail="color: red !important"
            note="Creates a separate override layer that wins over all non-important rules regardless of specificity."
          />
          <InfoRow
            label=":is() / :not() / :has()"
            detail=":is(#id, .class)"
            note="Take the specificity of their most specific argument — not their own name."
          />
          <InfoRow
            label=":where()"
            detail=":where(#id, .class)"
            note="Always contributes zero specificity, no matter what's inside."
          />
        </div>
      </Section>

    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function C({ children }: { children: ReactNode }) {
  return <InlineCode color="text-orbit">{children}</InlineCode>
}

const AXIS_KEYS = ['a', 'b', 'c', '0'] as const
type AxisKey = typeof AXIS_KEYS[number]

const AXIS_TEXT: Record<AxisKey, string> = {
  a:   'var(--color-solstice)',
  b:   'var(--color-orbit)',
  c:   'var(--color-supernova)',
  '0': 'var(--color-void-50)',
}

function ScoreBar({ axis, label, count, bg }: { axis: string; label: string; count: number; bg: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2">
        <code className="type-code text-void-0">{axis}</code>
        <code className="type-code text-void-0">{label}</code>
      </div>
      <code className="type-code text-void-0">{count}</code>
    </div>
  )
}

function AxisCard({
  title, children, examples, exampleColor,
}: {
  title: string
  children: ReactNode
  examples: string
  exampleColor: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-4 bg-void-20 border border-void-30">
      <p className="type-p-base text-void-90 m-0">{title}</p>
      <p className="type-p-sm text-void-60 m-0">{children}</p>
      <code className="type-code mt-auto" style={{ color: exampleColor }}>{examples}</code>
    </div>
  )
}

function ReferenceTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  const isAxisKey = (val: string): val is AxisKey => (AXIS_KEYS as readonly string[]).includes(val)
  const axisColor = (val: string) => isAxisKey(val) ? AXIS_TEXT[val] : 'inherit'

  return (
    <div className="overflow-x-auto">
      <table className="w-full type-p-sm border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                className="text-left px-3 py-2 text-void-50 whitespace-nowrap border-b border-void-20"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row[0]}-${i}`} className="border-b border-void-20">
              {row.map((cell, j) => {
                const isAxis = columns[j] === 'Axis'
                const isCode = columns[j] === 'Pattern' || columns[j] === 'Symbol' || columns[j] === 'Example'
                return (
                  <td
                    key={j}
                    className={`px-3 py-[10px] whitespace-nowrap ${isCode ? 'font-mono' : ''}`}
                    style={{
                      color: isAxis
                        ? axisColor(cell)
                        : isCode
                          ? 'var(--color-orbit)'
                          : 'var(--color-void-60)',
                      fontFamily: isAxis ? 'var(--font-mono)' : undefined,
                    }}
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoRow({ label, detail, note }: { label: string; detail: string; note: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg px-4 py-4 bg-void-10 border border-void-20">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="type-p-sm text-void-80">{label}</span>
        <code className="type-code text-orbit">{detail}</code>
      </div>
      <p className="type-p-sm text-void-60 m-0">{note}</p>
    </div>
  )
}
