import type { ReactNode } from 'react'
import { Section } from '@kern/molecules/Section'
import { BulletItem } from '@kern/atoms/BulletItem'
import { InlineCode } from '@kern/atoms/InlineCode'
import { ExternalLink } from '@kern/atoms/ExternalLink'
import { DataTable } from '@kern/molecules/DataTable'

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
          <ExternalLink href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity">
            specificity
          </ExternalLink>{' '}
          to decide which one takes effect. Defined in the CSS Selectors spec, it is a three part
          score <C>(a, b, c)</C> — IDs, classes and elements — compared left to right.
        </p>
      </div>

      {/* ── How it works ── */}
      <Section title="How it works">
        <div className="rounded-xl px-6 py-4 flex items-center justify-center bg-void-20 border border-void-30">
          <code className="type-code text-void-70">
            <span className="text-(--primary)">#app</span>
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
          <AxisCard title="ID selectors" examples="#header #nav" exampleColor="text-solstice">
            Each <InlineCode color="text-solstice" className="bg-void-30">#id</InlineCode> adds
            to the first column. Even a single ID outweighs any number of classes.
          </AxisCard>
          <AxisCard
            title="Classes, attributes, pseudo-classes"
            examples=".btn, :focus, [type]"
            exampleColor="text-orbit"
          >
            Each <InlineCode color="text-orbit" className="bg-void-30">.class</InlineCode>,{' '}
            <InlineCode color="text-orbit" className="bg-void-30">[attr]</InlineCode>, or{' '}
            <InlineCode color="text-orbit" className="bg-void-30">:hover</InlineCode> adds
            1 to the second column.
          </AxisCard>
          <AxisCard
            title="Type selectors & pseudo-elements"
            examples="div, span, ::after"
            exampleColor="text-supernova"
          >
            Each element tag like{' '}
            <InlineCode color="text-supernova" className="bg-void-30">p</InlineCode>,{' '}
            <InlineCode color="text-supernova" className="bg-void-30">h1</InlineCode>, or{' '}
            <InlineCode color="text-supernova" className="bg-void-30">::before</InlineCode> adds
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
        <DataTable
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
          ].map(([pattern, type, axis, example]) => [
            <span className="font-mono text-orbit">{pattern}</span>,
            type,
            <span className="font-mono" style={{ color: AXIS_TEXT[axis] ?? 'inherit' }}>{axis}</span>,
            <span className="font-mono text-orbit">{example}</span>,
          ])}
        />
      </Section>

      {/* ── Combinators ── */}
      <Section title="Combinators — no specificity contribution">
        <p className="type-p-sm text-void-60">
          Combinators describe relationships between selectors. They never add to the score.
        </p>
        <DataTable
          columns={['Symbol', 'Name', 'Meaning']}
          rows={[
            ['(space)', 'Descendant',       'Any depth inside'],
            ['>',       'Child',            'Direct child only'],
            ['+',       'Adjacent',         'Immediately after'],
            ['~',       'General sibling',  'Any sibling after'],
          ].map(([symbol, name, meaning]) => [
            <span className="font-mono text-orbit">{symbol}</span>,
            name,
            meaning,
          ])}
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
        <DataTable
          columns={['Feature', 'Example', 'Note']}
          rows={[
            [<span className="whitespace-nowrap">Inline styles</span>,           <span className="font-mono text-orbit whitespace-nowrap">{'style="color: red"'}</span>,  'Beats any selector — treated as (1,0,0,0), a fourth column above IDs.'],
            [<span className="whitespace-nowrap">!important</span>,              <span className="font-mono text-orbit whitespace-nowrap">color: red !important</span>,   'Creates a separate override layer that wins over all non-important rules regardless of specificity.'],
            [<span className="whitespace-nowrap">:is() / :not() / :has()</span>, <span className="font-mono text-orbit whitespace-nowrap">:is(#id, .class)</span>,       'Take the specificity of their most specific argument — not their own name.'],
            [<span className="whitespace-nowrap">:where()</span>,                <span className="font-mono text-orbit whitespace-nowrap">:where(#id, .class)</span>,    "Always contributes zero specificity, no matter what's inside."],
          ]}
        />
      </Section>

    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function C({ children }: { children: ReactNode }) {
  return <InlineCode color="text-orbit">{children}</InlineCode>
}

const AXIS_TEXT: Record<string, string> = {
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

type AxisColor = 'text-solstice' | 'text-orbit' | 'text-supernova'

function AxisCard({
  title, children, examples, exampleColor,
}: {
  title: string
  children: ReactNode
  examples: string
  exampleColor: AxisColor
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-4 bg-void-20 border border-void-30">
      <p className="type-p-sm text-void-90">{title}</p>
      <p className="type-annotation text-void-60 m-0">{children}</p>
      <div className="mt-auto">
        <InlineCode color={exampleColor} className="bg-void-30 whitespace-nowrap">{examples}</InlineCode>
      </div>
    </div>
  )
}

