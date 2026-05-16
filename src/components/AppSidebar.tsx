import { type ComponentType } from 'react'
import { Info, Search, GitCompare, ListChecks, Globe, type LucideIcon } from 'lucide-react'
import { HipukuLogo } from './HipukuLogo'
import { cn } from '@/lib/utils'

// ─── GitHub mark (lucide dropped brand icons) ─────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewId = 'about' | 'analyse' | 'compare' | 'rank'

interface AppSidebarProps {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SOCIAL_LINKS: { Icon: ComponentType<{ className?: string }>; label: string }[] = [
  { Icon: Globe,      label: 'specifi website' },
  { Icon: GitHubIcon, label: 'GitHub' },
]

const NAV_ITEMS: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: 'about',   label: 'About this tool',      icon: Info },
  { id: 'analyse', label: 'Analyse a selector',    icon: Search },
  { id: 'compare', label: 'Compare two selectors', icon: GitCompare },
  { id: 'rank',    label: 'Rank a stylesheet',     icon: ListChecks },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex flex-col justify-between shrink-0 h-full overflow-y-auto p-8 w-[360px] bg-void-10 border-r border-void-20">

      {/* ── Top section ── */}
      <div className="flex flex-col gap-16 w-full">

        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <img src="/specifi.svg" alt="specifi" className="h-7 w-auto" />

          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                className="text-void-60 inline-flex transition-all duration-200 hover:scale-125"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col gap-4 w-full">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl cursor-pointer',
                  'font-sans text-p-sm transition-all duration-200',
                  'bg-void-20 hover:bg-void-30',
                  'text-void-60 hover:text-void-90 hover:translate-x-1',
                  isActive && 'bg-void-30 text-solstice font-medium hover:translate-x-0',
                )}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Colophon ── */}
      <div className="flex items-center gap-2 text-void-60 text-p-sm">
        <span>2026 © specifi by</span>
        <HipukuLogo />
      </div>

    </aside>
  )
}
