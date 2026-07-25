import { cn } from '../../utils/helpers'

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-dark-700 text-dark-200',
    new: 'bg-green-500/20 text-green-400 border border-green-500/30',
    watched: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    category: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    favorite: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}
