import { useState }      from 'react'
import { Info, Search, GitCompare, ListChecks } from 'lucide-react'
import { AppShell }       from '@kern/templates/AppShell'
import { SocialBar }      from '@kern/molecules/SocialBar'
import { Colophon }       from '@kern/molecules/Colophon'
import { ViewAbout }      from '@/components/ViewAbout'
import { ViewAnalyse }    from '@/components/ViewAnalyse'
import { ViewCompare }    from '@/components/ViewCompare'
import { ViewRank }       from '@/components/ViewRank'
import type { ViewId }    from './types'

const NAV_ITEMS = [
  { id: 'about',   label: 'About this tool',       icon: Info       },
  { id: 'analyse', label: 'Analyse a selector',     icon: Search     },
  { id: 'compare', label: 'Compare two selectors',  icon: GitCompare },
  { id: 'rank',    label: 'Rank a stylesheet',       icon: ListChecks },
]

const LOGO_FILLS = {
  hi: 'var(--color-orbit)',
  pu: 'var(--color-solstice)',
  ku: 'var(--color-supernova)',
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')

  return (
    <AppShell
      logo={<img src="/specifi.svg" alt="specifi" className="h-7 w-auto" />}
      navItems={NAV_ITEMS}
      activeId={activeView}
      onNavigate={(id) => setActiveView(id as ViewId)}
      accentActiveClass="text-solstice"
      social={<SocialBar siteName="specifi" githubUrl="https://github.com/hipuku/specifi" />}
      colophon={<Colophon name="specifi" hoverFills={LOGO_FILLS} />}
      smallScreenNotice={
        <div className="flex flex-col gap-2 text-center max-w-xs">
          <p className="type-h4 text-ink-title">
            <code className="font-mono text-orbit">.phone</code> loses to{' '}
            <code className="font-mono text-solstice">#desktop</code>
          </p>
          <p className="type-p-sm text-ink-body">
            specifi is desktop-only for now. Open it on a wider screen — higher specificity wins.
          </p>
        </div>
      }
    >
      {activeView === 'about'   && <ViewAbout />}
      {activeView === 'analyse' && <ViewAnalyse />}
      {activeView === 'compare' && <ViewCompare />}
      {activeView === 'rank'    && <ViewRank />}
    </AppShell>
  )
}
