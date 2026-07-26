import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CalendarDays, Youtube, Film, ExternalLink, Play } from 'lucide-react'
import { useSeries } from '../hooks/useSeries'
import { useVideos } from '../hooks/useVideos'
import { useAnime } from '../hooks/useAnime'
import { useAnimeEpisodes } from '../hooks/useAnimeEpisodes'
import { getEffectiveKeywords } from '../services/rssParser'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const navigate = useNavigate()
  const { series } = useSeries()
  const { videos } = useVideos()
  const { animeList } = useAnime()
  const { episodes: animeEpisodes } = useAnimeEpisodes()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('monthly')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const events = useMemo(() => {
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
            result.push({
              id: v.id,
              type: 'youtube',
              title: v.title,
              seriesName: s.name,
              date,
              link: v.youtubeUrl,
              videoId: v.videoId,
              seriesId: s.id,
            })
          }
        }
      }
    }

    for (const a of animeList) {
      const animeEps = animeEpisodes.filter((e) => e.animeDocId === a.id)
      for (const ep of animeEps) {
        const date = ep.airingAt ? new Date(ep.airingAt) : null
        if (date && !isNaN(date.getTime())) {
          result.push({
            id: ep.id,
            type: 'anime',
            title: `${a.title} Episode ${ep.episode}`,
            seriesName: a.title,
            date,
            link: a.siteUrl || `https://anilist.co/anime/${a.anilistId}`,
            episode: ep.episode,
            animeDocId: a.id,
          })
        }
      }
    }

    result.sort((a, b) => a.date - b.date)
    return result
  }, [series, videos, animeList, animeEpisodes])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of events) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [events])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = new Date()

  const isToday = (d) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  const isCurrentMonth = (d) => d.getMonth() === month && d.getFullYear() === year

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const days = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = new Date(year, month, -firstDayOfWeek + i + 1)
    days.push(d)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    days.push(new Date(year, month, last.getDate() + 1))
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const [selectedDate, setSelectedDate] = useState(null)

  const selectedEvents = selectedDate
    ? eventsByDate[`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`] || []
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-dark-300" />
          <h1 className="text-2xl font-bold text-dark-100">Calendar</h1>
        </div>
        <div className="flex items-center gap-2 bg-dark-800/50 rounded-xl p-1">
          <button
            onClick={() => setViewType('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewType === 'weekly' ? 'bg-red-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewType('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewType === 'monthly' ? 'bg-red-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-700/30">
          <button onClick={prevMonth} className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-dark-100">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {DAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-dark-500 border-b border-dark-700/20">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            const dayEvents = eventsByDate[key] || []
            const isSel = selectedDate && d.toDateString() === selectedDate.toDateString()

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`min-h-[80px] p-1.5 border-b border-r border-dark-700/20 text-left transition-all hover:bg-dark-800/30 ${
                  !isCurrentMonth(d) ? 'opacity-30' : ''
                } ${isSel ? 'bg-dark-800/50 ring-1 ring-red-500/30' : ''} ${isToday(d) ? 'ring-1 ring-red-500/50' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday(d) ? 'text-red-400' : 'text-dark-400'}`}>
                  {d.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] leading-tight ${
                        e.type === 'youtube'
                          ? 'bg-red-500/15 text-red-300'
                          : 'bg-purple-500/15 text-purple-300'
                      }`}
                    >
                      {e.type === 'youtube' ? (
                        <Youtube className="w-2.5 h-2.5 flex-shrink-0" />
                      ) : (
                        <Film className="w-2.5 h-2.5 flex-shrink-0" />
                      )}
                      <span className="truncate">{e.seriesName}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-dark-500 pl-1">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-3">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-dark-500 py-4 text-center bg-dark-850/50 rounded-xl border border-dashed border-dark-700/30">
              No releases on this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-xl hover:border-dark-600/50 transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    e.type === 'youtube' ? 'bg-red-500/15' : 'bg-purple-500/15'
                  }`}>
                    {e.type === 'youtube' ? (
                      <Youtube className="w-4 h-4 text-red-400" />
                    ) : (
                      <Film className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-100 truncate">{e.title}</p>
                    <p className="text-xs text-dark-400">{e.seriesName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.type === 'youtube' && (
                      <>
                        <button
                          onClick={() => navigate(`/series/${e.seriesId}`)}
                          className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all"
                          title="View series"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Watch on YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    {e.type === 'anime' && (
                      <a
                        href={e.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-dark-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                        title="View on AniList"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
