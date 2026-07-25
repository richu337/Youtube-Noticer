import { cn } from '../../utils/helpers'

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  showAll = true,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {showAll && (
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
            !selected
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200 hover:bg-dark-800'
          )}
        >
          All
        </button>
      )}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
            selected === cat.id
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200 hover:bg-dark-800'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
