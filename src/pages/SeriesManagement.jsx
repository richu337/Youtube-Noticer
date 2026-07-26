import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Globe,
  Hash,
  Youtube,
  Volume2,
  Link,
  CalendarDays,
  Search,
  Loader2,
  Users,
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import SearchBar from '../components/filters/SearchBar'
import CategoryFilter from '../components/filters/CategoryFilter'
import EmptyState from '../components/ui/EmptyState'
import { useSeries } from '../hooks/useSeries'
import { useCategories } from '../hooks/useCategories'
import { useToast } from '../components/ui/Toast'
import { generateRssUrl, extractChannelIdFromUrl } from '../utils/helpers'
import { searchChannels } from '../services/youtubeSearch'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const emptyForm = {
  name: '',
  channelName: '',
  channelId: '',
  categoryId: '',
  keywords: '',
  notificationSoundUrl: '',
  showDays: [],
}

export default function SeriesManagement() {
  const { series, loading, create, update, remove } = useSeries()
  const { categories } = useCategories()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

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
    return result
  }, [series, search, selectedCategory])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      name: s.name || '',
      channelName: s.channelName || '',
      channelId: s.channelId || '',
      categoryId: s.categoryId || '',
      keywords: (s.keywords || []).join(', '),
      notificationSoundUrl: s.notificationSoundUrl || '',
      showDays: s.showDays || [],
    })
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.channelId) {
      toast('Name and Channel ID are required', 'error')
      return
    }

    const data = {
      name: form.name.trim(),
      channelName: form.channelName.trim(),
      channelId: form.channelId.trim(),
      rssUrl: generateRssUrl(form.channelId.trim()),
      categoryId: form.categoryId || categories[0]?.id || '',
      keywords: form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      notificationSoundUrl: form.notificationSoundUrl.trim(),
      showDays: form.showDays,
    }

    try {
      if (editing) {
        await update(editing.id, data)
        toast('Series updated', 'success')
      } else {
        await create(data)
        toast('Series added', 'success')
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      toast('Failed to save series', 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its videos?`)) return
    await remove(id)
    toast('Series deleted', 'info')
  }

  const handleChannelIdChange = (value) => {
    const extracted = extractChannelIdFromUrl(value)
    const channelId = extracted || value
    const channelName = value.includes('youtube.com') && value.includes('/@') && !form.channelName
      ? value.split('/@').pop().split('/')[0]
      : form.channelName
    setForm({ ...form, channelId, channelName, rssUrl: generateRssUrl(channelId) })
  }

  const handleSearchYouTube = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchChannels(searchQuery.trim())
      setSearchResults(results)
    } catch (err) {
      toast(err.message, 'error')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectChannel = (channel) => {
    setForm({
      ...form,
      channelId: channel.id,
      channelName: channel.title,
      rssUrl: generateRssUrl(channel.id),
    })
    setShowSearch(false)
    setSearchResults([])
    setSearchQuery('')
  }

  const toggleDay = (day) => {
    const current = form.showDays || []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    setForm({ ...form, showDays: next })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Series</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Series
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search series..."
            />
          </div>
        </div>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {filteredSeries.length === 0 ? (
        <EmptyState
          icon="folder"
          title={series.length === 0 ? 'No series yet' : 'No series match your filters'}
          description="Add a YouTube series to start tracking its latest videos."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Series
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSeries.map((s) => (
            <div
              key={s.id}
              className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5 hover:border-dark-600/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-100 truncate">{s.name}</h3>
                  <p className="text-sm text-dark-400 truncate mt-0.5">
                    {s.channelName}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-dark-400">
                <div className="flex items-center gap-2">
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <code className="bg-dark-800 px-2 py-0.5 rounded text-dark-300 truncate">
                    {s.channelId}
                  </code>
                </div>

                {s.keywords?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Hash className="w-3.5 h-3.5 text-purple-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {s.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.showDays?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-green-400" />
                    <div className="flex gap-1">
                      {DAYS.map((day, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            s.showDays.includes(i)
                              ? 'bg-green-500/10 text-green-400'
                              : 'text-dark-600'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.lastChecked && (
                  <p className="text-dark-500 pt-1">
                    Last checked: {new Date(s.lastChecked).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Series' : 'Add Series'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Series Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              placeholder="e.g., ATM10 Let's Play"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Channel Name
            </label>
            <input
              type="text"
              value={form.channelName}
              onChange={(e) => setForm({ ...form, channelName: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              placeholder="e.g., ChosenArchitect"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              YouTube Channel ID *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.channelId}
                onChange={(e) => handleChannelIdChange(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
                placeholder="Channel ID, URL, or @handle"
                required
              />
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="px-3 py-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700/50 rounded-xl text-dark-400 hover:text-dark-200 transition-all"
                title="Search YouTube"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-1.5">
              Paste a channel URL (youtube.com/channel/..., /@handle), or enter the Channel ID directly.
            </p>

            {showSearch && (
              <div className="mt-3 p-3 bg-dark-800/50 border border-dark-700/30 rounded-xl">
                <form onSubmit={handleSearchYouTube} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search channel name..."
                    className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-dark-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </form>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.length === 0 && !searching && searchQuery && (
                    <p className="text-center text-dark-500 py-4 text-sm">No channels found.</p>
                  )}
                  {searchResults.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleSelectChannel(ch)}
                      className="flex items-center gap-3 w-full p-2.5 bg-dark-800/50 border border-dark-700/30 rounded-lg hover:border-dark-600/50 transition-all text-left"
                    >
                      {ch.thumbnail ? (
                        <img src={ch.thumbnail} alt="" className="w-9 h-9 rounded-full object-cover bg-dark-700 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                          <Youtube className="w-4 h-4 text-dark-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate">{ch.title}</p>
                        <p className="text-xs text-dark-500 truncate">{ch.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 focus:outline-none focus:border-red-500/50 transition-all"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              placeholder="e.g., ATM10, Episode, Let's Play"
            />
            <p className="text-xs text-dark-500 mt-1.5">
              Only videos matching these keywords in the title will appear.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Show on days (optional)
            </label>
            <div className="flex gap-1.5">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${
                    (form.showDays || []).includes(i)
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700 border border-dark-700/50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-dark-500 mt-1.5">
              Series will only appear on the dashboard on selected days. Leave none selected to show every day.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Notification Sound URL (optional)
            </label>
            <input
              type="text"
              value={form.notificationSoundUrl}
              onChange={(e) => setForm({ ...form, notificationSoundUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              placeholder="https://example.com/sound.mp3"
            />
            <p className="text-xs text-dark-500 mt-1.5">
              Play a custom sound when a new video is found for this series. Supports MP3, OGG, WAV.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm font-medium transition-all border border-dark-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
            >
              {editing ? 'Update' : 'Add Series'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
