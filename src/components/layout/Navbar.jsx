import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ListVideo,
  Tags,
  Settings,
  RefreshCw,
  Film,
} from 'lucide-react'
import { APP_NAME } from '../../utils/constants'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/series', icon: ListVideo, label: 'Series' },
  { to: '/anime', icon: Film, label: 'Anime' },
  { to: '/categories', icon: Tags, label: 'Categories' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Navbar({ onSync, syncing }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:top-0 md:bottom-auto bg-dark-900/90 backdrop-blur-lg border-t md:border-t-0 md:border-b border-dark-700/50 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="hidden md:flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">YN</span>
          </div>
          <span className="text-dark-100 font-semibold text-lg">{APP_NAME}</span>
        </div>

        <div className="flex items-center justify-around md:justify-end gap-1 w-full md:w-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] md:text-xs md:hidden">{label}</span>
              <span className="hidden md:inline text-xs">{label}</span>
            </NavLink>
          ))}

          <button
            onClick={onSync}
            disabled={syncing}
            className="flex flex-col md:flex-row items-center gap-1 px-3 py-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-all disabled:opacity-50"
            title="Refresh all series"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="text-[10px] md:text-xs md:hidden">Sync</span>
            <span className="hidden md:inline text-xs">Sync</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
