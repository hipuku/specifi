import { useState } from 'react'
import { AppSidebar, type ViewId } from '@/components/AppSidebar'
import { ViewAbout }   from '@/components/ViewAbout'
import { ViewAnalyse } from '@/components/ViewAnalyse'
import { ViewCompare } from '@/components/ViewCompare'
import { ViewRank }    from '@/components/ViewRank'

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('about')

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />

      <main className="flex-1 overflow-y-auto p-10">
        {activeView === 'about'   && <ViewAbout />}
        {activeView === 'analyse' && <ViewAnalyse />}
        {activeView === 'compare' && <ViewCompare />}
        {activeView === 'rank'    && <ViewRank />}
      </main>
    </div>
  )
}
