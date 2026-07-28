import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Film, Star, Bell, Calendar } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, limit as limitQuery } from 'firebase/firestore'
import { db } from '../../services/db'
import { fetchAiringSchedules } from '../../services/anilist'

function useUnreadNotifications() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const q = query(
      collection(db, 'notificationHistory'),
      orderBy('createdAt', 'desc'),
      limitQuery(100)
    )
    const unsub = onSnapshot(q, (snap) => setCount(snap.docs.length), () => {})
    return unsub
  }, [])
  return count
}

function useNextRelease(animeList) {
  const [nextRelease, setNextRelease] = useState(null)

  useEffect(() => {
    const anilistIds = animeList.map((a) => a.anilistId).filter(Boolean)
    if (anilistIds.length === 0) return

    let cancelled = false
    const fetchNext = async () => {
      try {
        const mediaList = await fetchAiringSchedules(anilistIds)
        if (cancelled) return
        let nearest = null
        const now = Date.now()
        for (const media of mediaList) {
          const schedule = media.airingSchedule?.nodes || []
          for (const ep of schedule) {
            const airingAt = ep.airingAt * 1000
            if (airingAt > now) {
              if (!nearest || airingAt < nearest.airingAt) {
                nearest = {
                  title: media.title?.romaji || media.title?.english || 'Unknown',
                  episode: ep.episode,
                  airingAt,
                }
              }
            }
          }
        }
        if (!cancelled) setNextRelease(nearest)
      } catch {
        if (!cancelled) setNextRelease(null)
      }
    }
    fetchNext()
    return () => { cancelled = true }
  }, [animeList])

  return nextRelease
}

function useCountdown(target) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!target) { setRemaining(''); return }
    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setRemaining('Now'); return }
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`)
      } else {
        setRemaining(`${minutes}m`)
      }
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const start = prevRef.current
    const diff = value - start
    if (diff === 0) return

    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    prevRef.current = value
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <span>{display}</span>
}

const WIDGETS = [
  {
    key: 'new-videos',
    icon: Eye,
    label: 'New Videos',
    color: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    nav: '/',
  },
  {
    key: 'airing-anime',
    icon: Film,
    label: 'Airing Anime',
    color: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    nav: '/anime',
  },
  {
    key: 'favorites',
    icon: Star,
    label: 'Favorite Series',
    color: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    nav: '/series',
  },
  {
    key: 'notifications',
    icon: Bell,
    label: 'Notifications',
    color: { bg: 'bg-red-500/15', text: 'text-red-400' },
    nav: '/notifications',
  },
  {
    key: 'next-release',
    icon: Calendar,
    label: 'Next Release',
    color: { bg: 'bg-green-500/15', text: 'text-green-400' },
    nav: '/calendar',
  },
]

function WidgetCard({ widget, value, subtitle, onClick, children }) {
  const navigate = useNavigate()
  const Icon = widget.icon

  const handleClick = onClick || (() => navigate(widget.nav))

  return (
    <button
      onClick={handleClick}
      className="relative p-4 rounded-2xl bg-dark-850/80 backdrop-blur-md border border-dark-700/50 hover:border-dark-600/50 hover:bg-dark-800/60 transition-all duration-300 group text-left w-full active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${widget.color.bg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-5 h-5 ${widget.color.text}`} />
        </div>
        {children}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-dark-100 tabular-nums">
          {value}
        </div>
        <p className="text-xs text-dark-400 mt-0.5">{widget.label}</p>
        {subtitle && (
          <p className="text-[10px] text-dark-500 mt-1">{subtitle}</p>
        )}
      </div>
    </button>
  )
}

export default function DashboardWidgets({
  unwatchedCount,
  animeList,
  favoriteCount,
  episodes,
  onShowNewOnly,
}) {
  const notificationCount = useUnreadNotifications()
  const nextRelease = useNextRelease(animeList)
  const countdown = useCountdown(nextRelease?.airingAt)

  const airingAnimeCount = useMemo(() => {
    let count = 0
    for (const a of animeList) {
      const animeEpisodes = episodes.filter((e) => e.animeDocId === a.id)
      count += animeEpisodes.filter((e) => !e.watched).length
    }
    return count
  }, [animeList, episodes])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <WidgetCard
        widget={WIDGETS[0]}
        value={<AnimatedNumber value={unwatchedCount} />}
        onClick={() => onShowNewOnly?.()}
      />
      <WidgetCard
        widget={WIDGETS[1]}
        value={<AnimatedNumber value={airingAnimeCount} />}
      />
      <WidgetCard
        widget={WIDGETS[2]}
        value={<AnimatedNumber value={favoriteCount} />}
      />
      <WidgetCard
        widget={WIDGETS[3]}
        value={<AnimatedNumber value={notificationCount} />}
      />
      <WidgetCard
        widget={WIDGETS[4]}
        value={
          nextRelease ? (
            <span className="text-lg font-bold text-dark-100 tabular-nums">
              {countdown}
            </span>
          ) : (
            <span className="text-sm font-medium text-dark-500">No upcoming</span>
          )
        }
        subtitle={nextRelease ? `Ep ${nextRelease.episode} · ${nextRelease.title}` : undefined}
      />
    </div>
  )
}
