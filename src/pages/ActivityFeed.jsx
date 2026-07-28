import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Film, Bell, RefreshCw,
  Clock, Heart, HeartOff, EyeOff,
  Tv, ArrowLeft, Activity,
} from 'lucide-react'
import { collection, query, orderBy, onSnapshot, limit as limitQuery } from 'firebase/firestore'
import { db } from '../services/db'
import EmptyState from '../components/ui/EmptyState'
import { timeAgo } from '../utils/helpers'

const ACTIVITY_ICONS = {
  new_video: { icon: Tv, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  new_episode: { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  video_watched: { icon: Eye, color: 'text-green-400', bg: 'bg-green-500/15' },
  video_unwatched: { icon: EyeOff, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  favorite_added: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/15' },
  favorite_removed: { icon: HeartOff, color: 'text-red-400', bg: 'bg-red-500/15' },
  sync_manual: { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  sync_auto: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
}

const FILTERS = [
  { key: 'all', label: 'All', icon: Activity },
  { key: 'videos', label: 'Videos', icon: Tv },
  { key: 'anime', label: 'Anime', icon: Film },
  { key: 'favorites', label: 'Favorites', icon: Heart },
  { key: 'sync', label: 'Sync', icon: RefreshCw },
  { key: 'notifications', label: 'Alerts', icon: Bell },
]

const TYPE_CATEGORIES = {
  new_video: 'videos',
  video_watched: 'videos',
  video_unwatched: 'videos',
  new_episode: 'anime',
  favorite_added: 'favorites',
  favorite_removed: 'favorites',
  sync_manual: 'sync',
  sync_auto: 'sync',
}

function getDateGroup(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  if (date >= weekStart) return 'Earlier this week'
  return 'Older'
}

const DATE_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Older']

export default function ActivityFeed() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(30)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const q = query(
      collection(db, 'notificationHistory'),
      orderBy('createdAt', 'desc'),
      limitQuery(200)
    )
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + 20)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [activities])

  const grouped = useMemo(() => {
    const filtered = filter === 'all'
      ? activities
      : activities.filter((a) => TYPE_CATEGORIES[a.type] === filter)

    const groups = {}
    for (const a of filtered) {
      const date = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
      const group = getDateGroup(date)
      if (!groups[group]) groups[group] = []
      groups[group].push({ ...a, _date: date })
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b._date - a._date)
    }
    const ordered = {}
    for (const key of DATE_ORDER) {
      if (groups[key]) ordered[key] = groups[key]
    }
    return ordered
  }, [activities, filter])

  const groupsToRender = useMemo(() => {
    let rendered = 0
    const result = []
    for (const groupName of DATE_ORDER) {
      const items = grouped[groupName]
      if (!items || items.length === 0) continue
      const sliceCount = Math.min(items.length, visibleCount - rendered)
      if (sliceCount <= 0) break
      result.push({ groupName, items: items.slice(0, sliceCount) })
      rendered += sliceCount
    }
    return result
  }, [grouped, visibleCount])

  const hasMore = useMemo(() => {
    const total = Object.values(grouped).reduce((s, arr) => s + arr.length, 0)
    return total > visibleCount
  }, [grouped, visibleCount])

  const handleActivityClick = (activity) => {
    if (activity.seriesId) {
      navigate(`/series/${activity.seriesId}`)
    } else if (activity.type === 'new_episode') {
      navigate('/anime')
    } else if (activity.type?.startsWith('sync')) {
      navigate('/')
    } else if (activity.type === 'favorite_added' || activity.type === 'favorite_removed') {
      navigate('/series')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-dark-400 hover:text-dark-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-dark-100">Activity</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setVisibleCount(30) }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
              filter === f.key
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200'
            }`}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-dark-850/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : groupsToRender.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No activity yet"
          description="Activity from syncing, watching videos, and other actions will appear here."
        />
      ) : (
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-dark-700/20" />
          {groupsToRender.map(({ groupName, items }) => (
            <div key={groupName} className="mb-8 relative">
              <div className="flex items-center gap-3 mb-4 ml-1">
                <div className="w-2.5 h-2.5 rounded-full bg-dark-600 border-2 border-dark-800 flex-shrink-0" />
                <h2 className="text-xs font-semibold text-dark-400 uppercase tracking-widest">{groupName}</h2>
                <div className="flex-1 h-px bg-dark-700/20" />
              </div>
              <div className="space-y-2 ml-6">
                {items.map((activity) => {
                  const iconCfg = ACTIVITY_ICONS[activity.type] || { icon: Bell, color: 'text-dark-400', bg: 'bg-dark-800/50' }
                  const Icon = iconCfg.icon
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="w-full flex items-start gap-3 p-4 bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-xl hover:border-dark-600/50 hover:bg-dark-800/60 transition-all duration-300 group text-left animate-fade-in"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCfg.bg} group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4 h-4 ${iconCfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate">{activity.title || activity.message}</p>
                        {activity.message && activity.title !== activity.message && (
                          <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{activity.message}</p>
                        )}
                        <span className="text-[10px] text-dark-500 mt-1.5 block">
                          {activity.createdAt?.toDate ? timeAgo(activity.createdAt.toDate()) : timeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {hasMore && <div ref={sentinelRef} className="h-12" />}
        </div>
      )}
    </div>
  )
}
