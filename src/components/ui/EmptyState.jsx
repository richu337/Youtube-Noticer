import { Inbox, SearchX, FolderPlus, Hash } from 'lucide-react'

const icons = {
  inbox: Inbox,
  search: SearchX,
  folder: FolderPlus,
  hash: Hash,
}

export default function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description = '',
  action,
}) {
  const Icon = icons[icon] || Inbox

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-dark-800/50 border border-dark-700/30 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-dark-500" />
      </div>
      <h3 className="text-xl font-semibold text-dark-200 mb-2">{title}</h3>
      {description && (
        <p className="text-dark-400 max-w-md mb-6">{description}</p>
      )}
      {action && action}
    </div>
  )
}
