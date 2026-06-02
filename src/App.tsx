import { useState }      from 'react'
import { Info, Search, GitCompare, ListChecks, Globe } from 'lucide-react'
import { AppSidebar }    from '@kern/organisms/AppSidebar'
import { HipukuLogo }    from '@kern/organisms/HipukuLogo'
import { GitHubIcon }    from '@kern/atoms/GitHubIcon'
import { ViewAbout }     from '@/components/ViewAbout'
import { ViewAnalyse }   from '@/components/ViewAnalyse'
import { ViewCompare }   from '@/components/ViewCompare'
import { ViewRank }      from '@/components/ViewRank'
import type { ViewId }   from './types'

const NAV_ITEMS = [
  { id: 'about',   label: 'About this tool',       icon: Info       },
  { id: 'analyse', label: 'Analyse a selector',     icon: Search     },
  { id: 'compare', label: 'Compare two selectors',  icon: GitCompare },
  { id: 'rank',    label: 'Rank a stylesheet',       icon: ListChecks },
]

const SOCIAL_LINKS = [
  { Icon: Globe,      label: 'specifi website' },
  { Icon: GitHubIcon, label: 'GitHub'           },
]

const LOGO_FILLS = {
  hi: 'var(--color-orbit)',
  pu: 'var(--color-solstice)',
  ku: 'var(--color-supernova)',
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar
        logo={<img src="/specifi.svg" alt="specifi" className="h-7 w-auto" />}
        navItems={NAV_ITEMS}
        activeId={activeView}
        onNavigate={(id) => setActiveView(id as ViewId)}
        accentActiveClass="text-solstice"
        socialLinks={SOCIAL_LINKS}
        colophon={
          <div className="flex items-center gap-2">
            <span>2026 © specifi by</span>
            <HipukuLogo hoverFills={LOGO_FILLS} />
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-10">
        {activeView === 'about'   && <ViewAbout />}
        {activeView === 'analyse' && <ViewAnalyse />}
        {activeView === 'compare' && <ViewCompare />}
        {activeView === 'rank'    && <ViewRank />}
      </main>
    </div>
  )
}
