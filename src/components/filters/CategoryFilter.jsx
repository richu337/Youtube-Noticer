import { cn } from '../../utils/helpers'

const gradients = [
  'from-blue-500/20 to-cyan-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-green-500/20 to-emerald-500/20',
  'from-orange-500/20 to-red-500/20',
  'from-indigo-500/20 to-purple-500/20',
  'from-teal-500/20 to-cyan-500/20',
  'from-pink-500/20 to-rose-500/20',
  'from-yellow-500/20 to-orange-500/20',
]

const selectedGradients = [
  'from-blue-500/30 to-cyan-500/30',
  'from-purple-500/30 to-pink-500/30',
  'from-green-500/30 to-emerald-500/30',
  'from-orange-500/30 to-red-500/30',
  'from-indigo-500/30 to-purple-500/30',
  'from-teal-500/30 to-cyan-500/30',
  'from-pink-500/30 to-rose-500/30',
  'from-yellow-500/30 to-orange-500/30',
]

const textColors = [
  'text-blue-400',
  'text-purple-400',
  'text-green-400',
  'text-orange-400',
  'text-indigo-400',
  'text-teal-400',
  'text-pink-400',
  'text-yellow-400',
]

const borderColors = [
  'border-blue-500/30',
  'border-purple-500/30',
  'border-green-500/30',
  'border-orange-500/30',
  'border-indigo-500/30',
  'border-teal-500/30',
  'border-pink-500/30',
  'border-yellow-500/30',
]

function getGradientIndex(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
  }
  return Math.abs(hash) % gradients.length
}

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
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 border',
            !selected
              ? 'bg-gradient-to-r from-red-500/25 to-rose-500/25 text-red-400 border-red-500/30 shadow-sm shadow-red-500/10 scale-105'
              : 'bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-dark-200 hover:bg-dark-800'
          )}
        >
          All
        </button>
      )}
      {categories.map((cat) => {
        const idx = getGradientIndex(cat.name)
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 border',
              selected === cat.id
                ? `bg-gradient-to-r ${selectedGradients[idx]} ${textColors[idx]} ${borderColors[idx]} shadow-sm scale-105`
                : `bg-gradient-to-r ${gradients[idx]} ${textColors[idx]} ${borderColors[idx]} opacity-70 hover:opacity-100 hover:scale-105`
            )}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
