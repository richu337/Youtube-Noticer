import { useState } from 'react'
import { Trash2, ExternalLink, Film } from 'lucide-react'
import Badge from './Badge'
import { timeAgo, formatDate } from '../../utils/helpers'

export default function AnimeCard({ anime, episodes = [], onDelete }) {
  const [imgError, setImgError] = useState(false)
  const latestEpisode = episodes.length > 0 ? episodes[0] : null
  const totalNotified = episodes.length
  const isCurrentlyAiring = anime.status === 'RELEASING'

  return (
    <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl overflow-hidden hover:border-dark-600/50 transition-all group">
      <div className="flex">
        <div className="w-28 min-h-[160px] bg-dark-800 relative overflow-hidden flex-shrink-0">
          {!imgError && anime.coverImage ? (
            <img
              src={anime.coverImage}
              alt={anime.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-8 h-8 text-dark-600" />
            </div>
          )}
          {isCurrentlyAiring && (
            <div className="absolute top-1 left-1">
              <Badge variant="new">Airing</Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-dark-100 truncate">{anime.title}</h3>
              {anime.anilistId && (
                <a
                  href={`https://anilist.co/anime/${anime.anilistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-dark-500 hover:text-red-400 transition-colors mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on AniList
                </a>
              )}
            </div>
            <button
              onClick={() => onDelete?.(anime.id, anime.title)}
              className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
              title="Remove anime"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
            {anime.episodes && (
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                {anime.episodes} eps
              </span>
            )}
            {anime.format && (
              <Badge variant="category">{anime.format}</Badge>
            )}
            {totalNotified > 0 && (
              <span className="text-green-400">{totalNotified} episode{totalNotified > 1 ? 's' : ''} notified</span>
            )}
          </div>

          {latestEpisode && (
            <div className="mt-3 p-3 bg-dark-800/50 border border-dark-700/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-dark-200">
                  Episode {latestEpisode.episode}
                </span>
                <span className="text-xs text-dark-500">
                  {timeAgo(latestEpisode.airingAt)}
                </span>
              </div>
              {latestEpisode.airingAt && (
                <p className="text-xs text-dark-500 mt-1">
                  Aired: {formatDate(latestEpisode.airingAt)}
                </p>
              )}
            </div>
          )}

          {!latestEpisode && (
            <div className="mt-3 py-4 text-center text-dark-500 text-sm border border-dashed border-dark-700/30 rounded-xl">
              Waiting for next episode...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
