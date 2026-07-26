import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ExternalLink, Play } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { useSeries } from '../hooks/useSeries'
import { useVideos } from '../hooks/useVideos'
import { useCategories } from '../hooks/useCategories'
import { useRSSSync } from '../hooks/useRSSSync'
import { useToast } from '../components/ui/Toast'
import { timeAgo, getCategoryColor } from '../utils/helpers'
import { getEffectiveKeywords } from '../services/rssParser'
import { playNotificationSound } from '../utils/sound'

export default function SeriesVideos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { series } = useSeries()
  const { videos, markWatched, markUnwatched } = useVideos()
  const { categories } = useCategories()
  const { syncing, syncSeries } = useRSSSync()
  const toast = useToast()

  const s = useMemo(() => series.find((s) => s.id === id), [series, id])

  const categoryName = useMemo(() => {
    if (!s) return ''
    const cat = categories.find((c) => c.id === s.categoryId)
    return cat?.name || ''
  }, [s, categories])

  const seriesVideos = useMemo(() => {
    if (!s) return []
    let result = videos.filter((v) => v.seriesId === s.id)
    const effectiveKeywords = getEffectiveKeywords(s)
    if (effectiveKeywords.length) {
      const lowerKeywords = effectiveKeywords.map((k) => k.toLowerCase().trim())
      result = result.filter((v) =>
        lowerKeywords.some((kw) => v.title?.toLowerCase().includes(kw))
      )
    }
    result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    return result
  }, [videos, s])

  const handleRefresh = async () => {
    if (!s) return
    toast(`Refreshing ${s.name}...`, 'info')
    const saved = await syncSeries(s)
    toast(`${s.name} updated!`, 'success')
  }

  if (!s) {
    return (
      <div>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <EmptyState icon="search" title="Series not found" description="This series may have been deleted or the link is no longer valid." />
      </div>
    )
  }

  const color = getCategoryColor(categoryName || '')

  return (
    <div>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">{s.name}</h1>
            <p className="text-dark-400 mt-1">{s.channelName}</p>
            <div className="flex items-center gap-2 mt-2">
              {categoryName && (
                <Badge variant="category">
                  <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block" style={{ backgroundColor: color }} />
                  {categoryName}
                </Badge>
              )}
              <span className="text-sm text-dark-500">{seriesVideos.length} video{seriesVideos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-dark-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
          >
            {syncing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {seriesVideos.length === 0 ? (
        <EmptyState icon="youtube" title="No videos found" description="This series has no videos yet. Pull to refresh and check for new uploads." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {seriesVideos.map((video) => (
            <div
              key={video.id}
              className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-xl overflow-hidden hover:border-dark-600/50 transition-all group"
            >
              <div className="aspect-video bg-dark-800 relative overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {!video.watched && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="new">New</Badge>
                  </div>
                )}
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40"
                >
                  <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </a>
              </div>
              <div className="p-3 space-y-2">
                <h4 className="text-sm font-medium text-dark-100 leading-snug line-clamp-2">{video.title}</h4>
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <span>{timeAgo(video.publishedAt)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Watch
                  </a>
                  {video.watched ? (
                    <button
                      onClick={() => markUnwatched(video.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Unwatch
                    </button>
                  ) : (
                    <button
                      onClick={() => markWatched(video.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Watched
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
