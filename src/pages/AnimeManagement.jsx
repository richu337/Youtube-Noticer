import { useState, useMemo } from 'react'
import { Plus, Search, Film, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import SearchBar from '../components/filters/SearchBar'
import EmptyState from '../components/ui/EmptyState'
import AnimeCard from '../components/ui/AnimeCard'
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton'
import { useAnime } from '../hooks/useAnime'
import { useAnimeEpisodes } from '../hooks/useAnimeEpisodes'
import { searchAnime } from '../services/anilist'
import { useToast } from '../components/ui/Toast'

export default function AnimeManagement() {
  const { animeList, loading, create, remove } = useAnime()
  const { getForAnime } = useAnimeEpisodes()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(null)

  const filteredAnime = useMemo(() => {
    if (!search) return animeList
    const q = search.toLowerCase()
    return animeList.filter((a) => a.title?.toLowerCase().includes(q))
  }, [animeList, search])

  const openAddModal = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowModal(true)
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchAnime(searchQuery.trim())
      setSearchResults(results)
    } catch (err) {
      toast('Failed to search AniList', 'error')
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (media) => {
    if (adding) return
    setAdding(media.id)
    try {
      const exists = animeList.some((a) => a.anilistId === media.id)
      if (exists) {
        toast(`${media.title.romaji || media.title.english} is already tracked`, 'error')
        setAdding(null)
        return
      }

      await create({
        anilistId: media.id,
        title: media.title.romaji || media.title.english || 'Unknown',
        coverImage: media.coverImage?.large || media.coverImage?.medium || '',
        episodes: media.episodes || 0,
        status: media.status || '',
        format: media.format || '',
        siteUrl: media.siteUrl || '',
      })
      toast(`${media.title.romaji || media.title.english} added!`, 'success')
      setSearchQuery('')
      setSearchResults([])
      setShowModal(false)
    } catch (err) {
      toast('Failed to add anime', 'error')
      setAdding(null)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from tracking?`)) return
    await remove(id)
    toast('Anime removed', 'info')
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-dark-100 mb-6">Anime</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Anime</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Anime
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tracked anime..."
        />
      </div>

      {filteredAnime.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={animeList.length === 0 ? 'No anime tracked yet' : 'No anime match your search'}
          description="Add anime to get notified when new episodes air."
          action={
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Anime
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAnime.map((a) => (
            <AnimeCard
              key={a.id}
              anime={a}
              episodes={getForAnime(a.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Anime"
      >
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anime..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-dark-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </form>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-center text-dark-500 py-8 text-sm">
                No results found. Try a different search term.
              </p>
            )}

            {searchResults.map((media) => (
              <div
                key={media.id}
                className="flex items-center gap-3 p-3 bg-dark-800/50 border border-dark-700/30 rounded-xl hover:border-dark-600/50 transition-all"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                  {media.coverImage?.medium ? (
                    <img
                      src={media.coverImage.medium}
                      alt={media.title.romaji}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-4 h-4 text-dark-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">
                    {media.title.romaji || media.title.english}
                  </p>
                  <p className="text-xs text-dark-400 truncate">
                    {media.format || 'Unknown'} &middot; {media.episodes || '?'} eps
                    {media.status === 'RELEASING' ? ' &middot; Airing' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(media)}
                  disabled={adding === media.id}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-dark-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                >
                  {adding === media.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
