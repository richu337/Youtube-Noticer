import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tv, Film, Eye, Sun, Moon, Sunrise, CalendarDays } from 'lucide-react'
import SeriesCard from '../components/ui/SeriesCard'
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import FilterBar from '../components/filters/FilterBar'
import { useSeries } from '../hooks/useSeries'
import { useCategories } from '../hooks/useCategories'
import { useVideos } from '../hooks/useVideos'
import { useAnime } from '../hooks/useAnime'
import { useAnimeEpisodes } from '../hooks/useAnimeEpisodes'
import { useRSSSync } from '../hooks/useRSSSync'
import { getEffectiveKeywords } from '../services/rssParser'
import { useToast } from '../components/ui/Toast'
import { playNotificationSound } from '../utils/sound'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good Morning', icon: Sunrise }
  if (h < 17) return { text: 'Good Afternoon', icon: Sun }
  if (h < 21) return { text: 'Good Evening', icon: Moon }
  return { text: 'Good Night', icon: Moon }
}

function getBannerGradient() {
  const h = new Date().getHours()
  if (h < 12) return 'from-orange-500/10 via-amber-500/5 to-transparent'
  if (h < 17) return 'from-blue-500/10 via-cyan-500/5 to-transparent'
  if (h < 21) return 'from-purple-500/10 via-indigo-500/5 to-transparent'
  return 'from-dark-700/30 via-dark-800/10 to-transparent'
}

function getBannerBorder() {
  const h = new Date().getHours()
  if (h < 12) return 'border-orange-500/15'
  if (h < 17) return 'border-blue-500/15'
  if (h < 21) return 'border-purple-500/15'
  return 'border-dark-600/20'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { series, loading: seriesLoading, toggleFav, remove } = useSeries()
  const { categories } = useCategories()
  const { videos, markWatched, markUnwatched } = useVideos()
  const { animeList } = useAnime()
  const { getForAnime } = useAnimeEpisodes()
  const { syncing, syncSeries } = useRSSSync()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showWatched, setShowWatched] = useState(true)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const greeting = useMemo(() => getGreeting(), [])
  const bannerGradient = useMemo(() => getBannerGradient(), [])
  const bannerBorder = useMemo(() => getBannerBorder(), [])

  const categoryMap = useMemo(() => {
    const map = {}
    categories.forEach((c) => (map[c.id] = c.name))
    return map
  }, [categories])

  const seriesMap = useMemo(() => {
    const map = {}
    series.forEach((s) => (map[s.id] = s))
    return map
  }, [series])

  const videosBySeries = useMemo(() => {
    const map = {}
    videos.forEach((v) => {
      if (!map[v.seriesId]) map[v.seriesId] = []
      map[v.seriesId].push(v)
    })
    for (const key of Object.keys(map)) {
      let seriesVideos = map[key]
      const s = seriesMap[key]
      const effectiveKeywords = s ? getEffectiveKeywords(s) : []
      if (effectiveKeywords.length) {
        const lowerKeywords = effectiveKeywords.map((k) => k.toLowerCase().trim())
        seriesVideos = seriesVideos.filter((v) =>
          lowerKeywords.some((kw) => v.title?.toLowerCase().includes(kw))
        )
      }
      seriesVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      map[key] = seriesVideos.slice(0, 5)
    }
    return map
  }, [videos, seriesMap])

  const todayVisibleIds = useMemo(() => {
    const today = new Date().getDay()
    return new Set(
      series
        .filter((s) => !s.showDays || s.showDays.length === 0 || s.showDays.includes(today))
        .map((s) => s.id)
    )
  }, [series])

  const unwatchedCount = useMemo(() => {
    return videos.filter((v) => todayVisibleIds.has(v.seriesId) && !v.watched).length
  }, [videos, todayVisibleIds])

  const newAnimeCount = useMemo(() => {
    let count = 0
    for (const a of animeList) {
      const episodes = getForAnime(a.id)
      count += episodes.filter((e) => !e.watched).length
    }
    return count
  }, [animeList, getForAnime])

  const filteredSeries = useMemo(() => {
    let result = [...series]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.channelName?.toLowerCase().includes(q) ||
        videos.some((v) => v.seriesId === s.id && v.title?.toLowerCase().includes(q))
      )
    }

    if (selectedCategory) {
      result = result.filter((s) => s.categoryId === selectedCategory)
    }

    const today = new Date().getDay()
    result = result.filter((s) => {
      if (!s.showDays || s.showDays.length === 0) return true
      return s.showDays.includes(today)
    })

    if (showNewOnly) {
      result = result.filter((s) => {
        const sVideos = videosBySeries[s.id] || []
        return sVideos.some((v) => !v.watched)
      })
    }

    if (!showWatched) {
      result = result.filter((s) => {
        const sVideos = videosBySeries[s.id] || []
        return sVideos.some((v) => !v.watched)
      })
    }

    result.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1

      if (sortBy === 'newest') {
        const aDate = videosBySeries[a.id]?.[0]?.publishedAt || ''
        const bDate = videosBySeries[b.id]?.[0]?.publishedAt || ''
        return new Date(bDate) - new Date(aDate)
      }
      if (sortBy === 'oldest') {
        const aDate = videosBySeries[a.id]?.[0]?.publishedAt || ''
        const bDate = videosBySeries[b.id]?.[0]?.publishedAt || ''
        return new Date(aDate) - new Date(bDate)
      }
      if (sortBy === 'az') {
        return (a.name || '').localeCompare(b.name || '')
      }
      return 0
    })

    return result
  }, [series, search, selectedCategory, showNewOnly, showWatched, sortBy, videosBySeries])

  const handleRefresh = useCallback(async (seriesItem) => {
    toast(`Refreshing ${seriesItem.name}...`, 'info')
    const saved = await syncSeries(seriesItem)
    if (saved.length > 0) {
      playNotificationSound(seriesItem.notificationSoundUrl)
    }
    toast(`${seriesItem.name} updated!`, 'success')
  }, [syncSeries, toast])

  const handleDelete = useCallback(async (id) => {
    const confirmed = window.confirm('Delete this series and all its videos?')
    if (!confirmed) return
    await remove(id)
    toast('Series deleted', 'info')
  }, [remove, toast])

  if (seriesLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-dark-100 mb-6">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  const GreetingIcon = greeting.icon

  return (
    <div>
      <div
        className={`relative mb-8 p-6 rounded-2xl bg-gradient-to-br ${bannerGradient} border ${bannerBorder} backdrop-blur-sm overflow-hidden`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-dark-800/40 backdrop-blur-sm border border-dark-600/20">
              <GreetingIcon className="w-5 h-5 text-dark-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-100">{greeting.text}</h1>
              <p className="text-xs text-dark-400 mt-0.5">
                <CalendarDays className="w-3 h-3 inline mr-1 -mt-0.5" />
                {formatDate()}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-5 flex-wrap">
            <button
              onClick={() => setShowNewOnly(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                showNewOnly
                  ? 'bg-blue-500/20 border-blue-500/30'
                  : 'bg-dark-800/30 border-dark-600/15 hover:bg-dark-700/40'
              }`}
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-dark-200">{unwatchedCount} Unwatched</span>
            </button>
            <button
              onClick={() => { setShowNewOnly(false); setSelectedCategory(null); setSearch('') }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-800/30 backdrop-blur-sm border border-dark-600/15 hover:bg-dark-700/40 transition-all duration-200"
            >
              <Tv className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-dark-200">{series.length} Series</span>
            </button>
            {newAnimeCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-800/30 backdrop-blur-sm border border-dark-600/15">
                <Film className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-dark-200">{newAnimeCount} New Anime</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showWatched={showWatched}
        onToggleWatched={() => setShowWatched(!showWatched)}
        showNewOnly={showNewOnly}
        onToggleNewOnly={() => setShowNewOnly(!showNewOnly)}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="mt-6">
        {filteredSeries.length === 0 ? (
          <EmptyState
            icon={search || selectedCategory ? 'search' : series.length === 0 ? 'tv' : 'smile'}
            title={
              search || selectedCategory
                ? 'No series match your filters'
                : series.length === 0
                  ? 'No series tracked yet'
                  : 'You\'re all caught up!'
            }
            description={
              search || selectedCategory
                ? 'Try a different search or clear your filters.'
                : series.length === 0
                  ? 'Add a series to start tracking YouTube videos.'
                  : 'No new uploads today. Enjoy your free time!'
            }
            action={
              series.length === 0 && !search && !selectedCategory ? (
                <button
                  onClick={() => navigate('/series')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Add Your First Series
                </button>
              ) : (search || selectedCategory) ? (
                <button
                  onClick={() => { setSearch(''); setSelectedCategory(null) }}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-all"
                >
                  Clear Filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSeries.map((s, i) => (
              <SeriesCard
                key={s.id}
                series={s}
                categoryName={categoryMap[s.categoryId]}
                videos={videosBySeries[s.id] || []}
                totalVideos={videos.filter((v) => v.seriesId === s.id).length}
                onToggleFavorite={toggleFav}
                onMarkWatched={markWatched}
                onMarkUnwatched={markUnwatched}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
                onViewAll={() => navigate(`/series/${s.id}`)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
