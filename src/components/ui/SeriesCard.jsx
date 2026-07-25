import { useState } from 'react'
import { Star, StarOff, Youtube, RefreshCw, Trash2 } from 'lucide-react'
import VideoCard from './VideoCard'
import Badge from './Badge'
import { cn, getCategoryColor } from '../../utils/helpers'

export default function SeriesCard({
  series,
  categoryName,
  videos = [],
  onToggleFavorite,
  onMarkWatched,
  onMarkUnwatched,
  onRefresh,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false)
  const color = getCategoryColor(categoryName || '')

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden border transition-all duration-300',
        'bg-dark-850/80 backdrop-blur-md shadow-xl hover:shadow-2xl',
        series.favorite
          ? 'border-yellow-500/30 ring-1 ring-yellow-500/10'
          : 'border-dark-700/50'
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-dark-100 truncate">
                {series.name}
              </h3>
              {series.favorite && (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-dark-400">{series.channelName}</span>
              {categoryName && (
                <Badge variant="category" className="text-[10px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-1 inline-block"
                    style={{ backgroundColor: color }}
                  />
                  {categoryName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="space-y-3 mt-3">
            {videos.slice(0, 2).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onMarkWatched={onMarkWatched}
                onMarkUnwatched={onMarkUnwatched}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 py-6 text-center text-dark-500 text-sm border border-dashed border-dark-700/30 rounded-xl">
            No videos yet. Pull to refresh.
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-700/20">
          <button
            onClick={() => onToggleFavorite?.(series.id, series.favorite)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              series.favorite
                ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
                : 'text-dark-500 hover:text-dark-300 bg-dark-800/50 hover:bg-dark-800'
            )}
            title={series.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {series.favorite ? <Star className="w-4 h-4 fill-yellow-400" /> : <StarOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onRefresh?.(series)}
            className="p-2 rounded-lg text-dark-500 hover:text-dark-300 bg-dark-800/50 hover:bg-dark-800 transition-colors"
            title="Refresh this series"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete?.(series.id)}
            className="p-2 rounded-lg text-dark-500 hover:text-red-400 bg-dark-800/50 hover:bg-red-500/10 transition-colors ml-auto"
            title="Delete series"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
