import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Tv, Film, Star, Bell, Calendar, Eye, Video, Hash, Clock, ArrowRight, Tag } from 'lucide-react'

const RECENT_KEY = 'yn_recent_searches'
const MAX_RECENT = 8

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

function saveRecent(searches) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)))
}

function addRecent(query) {
  const recent = loadRecent().filter((s) => s !== query)
  recent.unshift(query)
  saveRecent(recent)
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY)
}

function fuzzyMatch(query, target) {
  if (!query || !target) return false
  const q = query.toLowerCase().replace(/\s+/g, '')
  const t = target.toLowerCase()
  if (t.includes(q)) return { match: true, score: 100 + t.length - q.length }
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) qi++
  }
  if (qi === q.length) {
    return { match: true, score: qi * 10 - Math.abs(t.length - q.length) }
  }
  let typos = 0
  qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) {
      qi++
    } else if (ti + 1 < t.length && q[qi] === t[ti + 1]) {
      typos++
      ti++
      qi++
    } else if (qi + 1 < q.length && q[qi + 1] === t[ti]) {
      typos++
      qi += 2
    } else {
      typos++
    }
  }
  if (qi >= q.length - 1 && typos <= 2) {
    return { match: true, score: Math.max(1, qi * 5 - typos * 15) }
  }
  return { match: false, score: 0 }
}

function highlightText(text, query) {
  if (!query || !text) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? `<mark class="bg-red-500/30 text-red-200 rounded-sm px-0.5">${part}</mark>`
      : part
  ).join('')
}

function SearchResultItem({ icon: Icon, iconBg, iconColor, title, description, onClick, query }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-800/60 transition-all duration-150 text-left group active:scale-[0.99]"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-dark-100 truncate" dangerouslySetInnerHTML={{ __html: highlightText(title, query) }} />
        {description && (
          <div className="text-xs text-dark-400 mt-0.5 truncate" dangerouslySetInnerHTML={{ __html: highlightText(description, query) }} />
        )}
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-dark-600 group-hover:text-dark-400 transition-colors flex-shrink-0" />
    </button>
  )
}

function ResultGroup({ label, icon: GroupIcon, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
        <GroupIcon className="w-3.5 h-3.5 text-dark-500" />
        <span className="text-[10px] font-semibold text-dark-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  )
}

export default function SearchEverywhere({
  isOpen,
  onClose,
  series,
  videos,
  animeList,
  episodes,
  categories,
  notificationHistory,
  calendarEvents,
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const [recentSearches, setRecentSearches] = useState(loadRecent)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(-1)
      setRecentSearches(loadRecent())
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  const handleNavigate = useCallback((path) => {
    addRecent(query || 'search')
    onClose()
    navigate(path)
  }, [query, onClose, navigate])

  const allResults = useMemo(() => {
    if (!query || query.trim().length < 1) return { groups: [], flat: [] }
    const q = query.trim()
    const flat = []
    const groups = []

    const videoResults = []
    const seenVideos = new Set()
    for (const v of videos) {
      if (seenVideos.has(v.id)) continue
      seenVideos.add(v.id)
      const match = fuzzyMatch(q, v.title)
      if (match.match) {
        const seriesName = series.find((s) => s.id === v.seriesId)?.name || ''
        videoResults.push({
          type: 'video',
          icon: Eye,
          iconBg: 'bg-blue-500/15',
          iconColor: 'text-blue-400',
          title: v.title,
          description: seriesName,
          score: match.score,
          onClick: () => handleNavigate(`/series/${v.seriesId}`),
        })
      }
    }
    videoResults.sort((a, b) => b.score - a.score)
    videoResults.slice(0, 5).forEach((r) => flat.push(r))
    if (videoResults.length > 0) {
      groups.push({ label: 'Videos', icon: Tv, results: videoResults.slice(0, 5) })
    }

    const seriesResults = []
    for (const s of series) {
      const nameMatch = fuzzyMatch(q, s.name)
      const channelMatch = fuzzyMatch(q, s.channelName)
      const bestScore = Math.max(nameMatch.match ? nameMatch.score : 0, channelMatch.match ? channelMatch.score : 0)
      if (bestScore > 0) {
        seriesResults.push({
          type: 'series',
          icon: Tv,
          iconBg: 'bg-red-500/15',
          iconColor: 'text-red-400',
          title: s.name,
          description: s.channelName,
          score: bestScore,
          onClick: () => handleNavigate(`/series/${s.id}`),
        })
      }
    }
    seriesResults.sort((a, b) => b.score - a.score)
    seriesResults.slice(0, 5).forEach((r) => flat.push(r))
    if (seriesResults.length > 0) {
      groups.push({ label: 'Series', icon: Tv, results: seriesResults.slice(0, 5) })
    }

    const animeResults = []
    for (const a of animeList) {
      const titleMatch = fuzzyMatch(q, a.title)
      if (titleMatch.match) {
        animeResults.push({
          type: 'anime',
          icon: Film,
          iconBg: 'bg-purple-500/15',
          iconColor: 'text-purple-400',
          title: a.title,
          description: a.status || 'Anime',
          score: titleMatch.score,
          onClick: () => handleNavigate('/anime'),
        })
      }
    }
    animeResults.sort((a, b) => b.score - a.score)
    animeResults.slice(0, 5).forEach((r) => flat.push(r))
    if (animeResults.length > 0) {
      groups.push({ label: 'Anime', icon: Film, results: animeResults.slice(0, 5) })
    }

    const episodeResults = []
    for (const ep of episodes) {
      const animeTitle = animeList.find((a) => a.id === ep.animeDocId)?.title || ''
      const epTitle = `Episode ${ep.episode}`
      const match = fuzzyMatch(q, `${animeTitle} ${epTitle}`)
      if (match.match) {
        episodeResults.push({
          type: 'episode',
          icon: Hash,
          iconBg: 'bg-purple-500/15',
          iconColor: 'text-purple-400',
          title: epTitle,
          description: animeTitle,
          score: match.score,
          onClick: () => handleNavigate('/anime'),
        })
      }
    }
    episodeResults.sort((a, b) => b.score - a.score)
    episodeResults.slice(0, 3).forEach((r) => flat.push(r))

    const categoryResults = []
    for (const c of categories) {
      const match = fuzzyMatch(q, c.name)
      if (match.match) {
        categoryResults.push({
          type: 'category',
          icon: Tag,
          iconBg: 'bg-green-500/15',
          iconColor: 'text-green-400',
          title: c.name,
          description: 'Category',
          score: match.score,
          onClick: () => {
            addRecent(query)
            onClose()
            navigate(`/?category=${c.id}`)
          },
        })
      }
    }
    categoryResults.sort((a, b) => b.score - a.score)
    categoryResults.slice(0, 3).forEach((r) => flat.push(r))
    if (categoryResults.length > 0) {
      groups.push({ label: 'Categories', icon: Tag, results: categoryResults.slice(0, 3) })
    }

    const favoriteResults = []
    for (const s of series) {
      if (!s.favorite) continue
      const match = fuzzyMatch(q, s.name)
      if (match.match) {
        favoriteResults.push({
          type: 'favorite',
          icon: Star,
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-400',
          title: s.name,
          description: 'Favorite Series',
          score: match.score,
          onClick: () => handleNavigate(`/series/${s.id}`),
        })
      }
    }
    favoriteResults.sort((a, b) => b.score - a.score)
    favoriteResults.slice(0, 5).forEach((r) => flat.push(r))
    if (favoriteResults.length > 0) {
      groups.push({ label: 'Favorites', icon: Star, results: favoriteResults.slice(0, 5) })
    }

    const calendarResults = []
    if (calendarEvents && calendarEvents.length > 0) {
      for (const ev of calendarEvents) {
        const match = fuzzyMatch(q, ev.title)
        if (match.match) {
          calendarResults.push({
            type: 'calendar',
            icon: Calendar,
            iconBg: 'bg-green-500/15',
            iconColor: 'text-green-400',
            title: ev.title,
            description: ev.seriesName || '',
            score: match.score,
            onClick: () => handleNavigate('/calendar'),
          })
        }
      }
      calendarResults.sort((a, b) => b.score - a.score)
      calendarResults.slice(0, 3).forEach((r) => flat.push(r))
      if (calendarResults.length > 0) {
        groups.push({ label: 'Calendar', icon: Calendar, results: calendarResults.slice(0, 3) })
      }
    }

    const notificationResults = []
    for (const n of notificationHistory) {
      const titleMatch = fuzzyMatch(q, n.title || '')
      const msgMatch = fuzzyMatch(q, n.message || '')
      const bestScore = Math.max(titleMatch.match ? titleMatch.score : 0, msgMatch.match ? msgMatch.score : 0)
      if (bestScore > 0) {
        notificationResults.push({
          type: 'notification',
          icon: Bell,
          iconBg: 'bg-red-500/15',
          iconColor: 'text-red-400',
          title: n.title || n.message || '',
          description: n.type || '',
          score: bestScore,
          onClick: () => handleNavigate('/notifications'),
        })
      }
    }
    notificationResults.sort((a, b) => b.score - a.score)
    notificationResults.slice(0, 5).forEach((r) => flat.push(r))
    if (notificationResults.length > 0) {
      groups.push({ label: 'Notifications', icon: Bell, results: notificationResults.slice(0, 5) })
    }

    flat.sort((a, b) => b.score - a.score)
    return { groups, flat }
  }, [query, series, videos, animeList, episodes, categories, notificationHistory, calendarEvents, handleNavigate])

  const flatResults = allResults.flat

  useEffect(() => {
    if (!resultsRef.current || flatResults.length === 0) return
    const selected = resultsRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, flatResults.length])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) {
        setQuery('')
        setSelectedIndex(-1)
      } else {
        onClose()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1))
      return
    }
    if (e.key === 'Enter' && selectedIndex >= 0 && flatResults[selectedIndex]) {
      e.preventDefault()
      flatResults[selectedIndex].onClick()
      return
    }
    if (e.key === 'Enter' && query.trim() && flatResults.length > 0) {
      e.preventDefault()
      flatResults[0].onClick()
      return
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />
      <div className="relative w-full max-w-xl bg-dark-900/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-700/30">
          <Search className="w-5 h-5 text-dark-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search videos, series, anime, categories..."
            className="flex-1 bg-transparent text-dark-100 text-base placeholder:text-dark-500 outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSelectedIndex(-1); inputRef.current?.focus() }}
              className="p-1 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800/50 text-dark-500 text-[10px] font-medium border border-dark-700/30"
          >
            ESC
          </button>
        </div>

        <div ref={resultsRef} className="max-h-[55vh] overflow-y-auto p-3 search-scroll">
          {!query || query.trim().length < 1 ? (
            <div>
              {recentSearches.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dark-500" />
                      <span className="text-[10px] font-semibold text-dark-500 uppercase tracking-widest">Recent Searches</span>
                    </div>
                    <button
                      onClick={() => { clearRecent(); setRecentSearches([]) }}
                      className="text-[10px] text-dark-500 hover:text-dark-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(s)
                          inputRef.current?.focus()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-dark-800/60 transition-all text-left group"
                      >
                        <Clock className="w-3.5 h-3.5 text-dark-600 group-hover:text-dark-400" />
                        <span className="text-sm text-dark-300 truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-3 py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-dark-500" />
                </div>
                <p className="text-sm text-dark-400">Type to search across the entire app</p>
                <p className="text-xs text-dark-500 mt-1">Use Ctrl+K to open this search anytime</p>
              </div>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-dark-500" />
              </div>
              <p className="text-sm text-dark-400">No results found</p>
              <p className="text-xs text-dark-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            allResults.groups.map((group, gi) => (
              <ResultGroup key={gi} label={group.label} icon={group.icon}>
                {group.results.map((result, ri) => (
                  <div
                    key={`${gi}-${ri}`}
                    data-selected={selectedIndex === flatResults.indexOf(result)}
                    className={`rounded-xl ${selectedIndex === flatResults.indexOf(result) ? 'bg-dark-800/60 ring-1 ring-red-500/20' : ''}`}
                  >
                    <SearchResultItem
                      icon={result.icon}
                      iconBg={result.iconBg}
                      iconColor={result.iconColor}
                      title={result.title}
                      description={result.description}
                      onClick={result.onClick}
                      query={query}
                    />
                  </div>
                ))}
              </ResultGroup>
            ))
          )}
        </div>

        <div className="hidden sm:flex items-center justify-between px-5 py-3 border-t border-dark-700/30 text-[10px] text-dark-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700/30">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700/30">↵</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700/30">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}