import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Hash } from 'lucide-react'
import SeriesCard from '../components/ui/SeriesCard'
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import FilterBar from '../components/filters/FilterBar'
import { useSeries } from '../hooks/useSeries'
import { useCategories } from '../hooks/useCategories'
import { useVideos } from '../hooks/useVideos'
import { useRSSSync } from '../hooks/useRSSSync'
import { getEffectiveKeywords } from '../services/rssParser'
import { useToast } from '../components/ui/Toast'
import { playNotificationSound } from '../utils/sound'

export default function Dashboard() {
  const navigate = useNavigate()
  const { series, loading: seriesLoading, toggleFav, remove } = useSeries()
  const { categories } = useCategories()
  const { videos, markWatched, markUnwatched, getForSeries } = useVideos()
  const { syncing, syncSeries } = useRSSSync()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showWatched, setShowWatched] = useState(true)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

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

  const filteredSeries = useMemo(() => {
    let result = [...series]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.channelName?.toLowerCase().includes(q)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>
        <span className="text-sm text-dark-400 bg-dark-800/50 px-3 py-1 rounded-lg">
          {filteredSeries.length} series
        </span>
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
            icon="inbox"
            title="No series found"
            description={
              series.length === 0
                ? 'Add your first series to start tracking YouTube videos.'
                : 'Try changing your search or filter settings.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSeries.map((s) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
