import { useState } from 'react'
import { Play, Eye, EyeOff, ExternalLink } from 'lucide-react'
import Badge from './Badge'
import { timeAgo, truncateText } from '../../utils/helpers'

export default function VideoCard({ video, onMarkWatched, onMarkUnwatched }) {
  const [imgError, setImgError] = useState(false)
  const isNew = !video.watched

  return (
    <div className="group relative bg-dark-850/60 backdrop-blur-sm border border-dark-700/30 rounded-xl overflow-hidden hover:border-dark-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="aspect-video bg-dark-800 relative overflow-hidden">
        {!imgError ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-800">
            <Play className="w-8 h-8 text-dark-600" />
          </div>
        )}

        {isNew && (
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
        <h4 className="text-sm font-medium text-dark-100 leading-snug line-clamp-2">
          {truncateText(video.title, 80)}
        </h4>

        <div className="flex items-center justify-between text-xs text-dark-400">
          <span>{video.channelName || 'YouTube'}</span>
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
              onClick={() => onMarkUnwatched?.(video.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Unwatch
            </button>
          ) : (
            <button
              onClick={() => onMarkWatched?.(video.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Watched
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
