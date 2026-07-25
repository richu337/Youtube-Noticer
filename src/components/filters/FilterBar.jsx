import { Search, Filter, ArrowUpDown } from 'lucide-react'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'

export default function FilterBar({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  showWatched,
  onToggleWatched,
  showNewOnly,
  onToggleNewOnly,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Search series..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleNewOnly}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              showNewOnly
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200'
            }`}
          >
            New Only
          </button>

          <button
            onClick={onToggleWatched}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              showWatched
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200'
            }`}
          >
            Show Watched
          </button>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-dark-800/50 border border-dark-700/30 text-dark-400 hover:text-dark-200 transition-all focus:outline-none cursor-pointer appearance-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>

      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={onCategoryChange}
      />
    </div>
  )
}
