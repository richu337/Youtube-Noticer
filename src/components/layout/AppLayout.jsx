import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'
import Navbar from './Navbar'
import SearchEverywhere from '../search/SearchEverywhere'
import { useSeries } from '../../hooks/useSeries'
import { useVideos } from '../../hooks/useVideos'
import { useAnime } from '../../hooks/useAnime'
import { useAnimeEpisodes } from '../../hooks/useAnimeEpisodes'
import { useCategories } from '../../hooks/useCategories'
import { useRSSSync } from '../../hooks/useRSSSync'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../ui/Toast'
import { collection, query, orderBy, onSnapshot, limit as limitQuery } from 'firebase/firestore'
import { db } from '../../services/db'
import { getEffectiveKeywords } from '../../services/rssParser'

export default function AppLayout() {
  const { series } = useSeries()
  const { videos } = useVideos()
  const { animeList } = useAnime()
  const { episodes } = useAnimeEpisodes()
  const { categories } = useCategories()
  const { syncing, progress, syncAll, cleanupOldVideos } = useRSSSync()
  const { settings } = useSettings()
  const toast = useToast()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'notificationHistory'),
      orderBy('createdAt', 'desc'),
      limitQuery(200)
    )
    const unsub = onSnapshot(q, (snap) => {
      setNotificationHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, () => {})
    return unsub
  }, [])

  const calendarEvents = useMemo(() => {
    const result = []
    for (const s of series) {
      const seriesVideos = videos.filter((v) => v.seriesId === s.id)
      const effectiveKeywords = getEffectiveKeywords(s)
      for (const v of seriesVideos) {
        const date = v.publishedAt ? new Date(v.publishedAt) : null
        if (date && !isNaN(date.getTime())) {
          const matchesKeyword = effectiveKeywords.length === 0 ||
            effectiveKeywords.some((kw) => v.title?.toLowerCase().includes(kw.toLowerCase().trim()))
          if (matchesKeyword) {
            result.push({ id: v.id, title: v.title, seriesName: s.name, date })
          }
        }
      }
    }
    for (const a of animeList) {
      const animeEps = episodes.filter((e) => e.animeDocId === a.id)
      for (const ep of animeEps) {
        const date = ep.airingAt ? new Date(ep.airingAt) : null
        if (date && !isNaN(date.getTime())) {
          result.push({ id: ep.id, title: `${a.title} Episode ${ep.episode}`, seriesName: a.title, date })
        }
      }
    }
    return result
  }, [series, videos, animeList, episodes])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark')
  }, [settings.theme])

  const handleSync = useCallback(async () => {
    if (syncing || series.length === 0) return
    toast('Starting RSS sync...', 'info')
    const newVideos = await syncAll(series, {
      notificationSoundUrl: settings.notificationSoundUrl,
      notificationsEnabled: settings.notificationsEnabled,
    })
    if (newVideos) {
      toast('Sync complete! New videos have been added.', 'success')
    }
    if (settings.autoCleanup) {
      const deleted = await cleanupOldVideos(settings.autoCleanupDays || 30)
      if (deleted > 0) {
        toast(`Cleaned up ${deleted} old video(s)`, 'info')
      }
    }
  }, [syncing, series, syncAll, settings.notificationSoundUrl, settings.notificationsEnabled, settings.autoCleanup, settings.autoCleanupDays, cleanupOldVideos, toast])

  const syncRef = useRef()
  syncRef.current = async () => {
    if (series.length === 0) return
    await syncAll(series, {
      notificationSoundUrl: settings.notificationSoundUrl,
      notificationsEnabled: settings.notificationsEnabled,
      source: 'auto',
    })
    if (settings.autoCleanup) {
      await cleanupOldVideos(settings.autoCleanupDays || 30)
    }
  }

  useEffect(() => {
    if (settings.syncInterval < 5) return

    const ms = settings.syncInterval * 60 * 1000
    const id = setInterval(() => syncRef.current(), ms)

    return () => clearInterval(id)
  }, [settings.syncInterval, settings.autoCleanup, settings.autoCleanupDays])

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 font-sans">
      <Navbar onSync={handleSync} syncing={syncing} onSearchOpen={() => setSearchOpen(true)} />

      <button
        onClick={() => setSearchOpen(true)}
        className="hidden md:flex fixed top-4 right-4 z-30 items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850/80 backdrop-blur-md border border-dark-700/50 text-dark-400 hover:text-dark-200 hover:border-dark-600/50 transition-all text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700/30 text-[10px] ml-1">Ctrl+K</kbd>
      </button>

      <SearchEverywhere
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        series={series}
        videos={videos}
        animeList={animeList}
        episodes={episodes}
        categories={categories}
        notificationHistory={notificationHistory}
        calendarEvents={calendarEvents}
      />

      {syncing && progress && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-dark-850/90 backdrop-blur-md border border-dark-700/50 rounded-xl px-5 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
            <span className="text-sm text-dark-200">{progress}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pt-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
