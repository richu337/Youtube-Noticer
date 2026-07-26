import { Inbox, SearchX, FolderPlus, Hash, Tv, Calendar, Bell, CheckCircle, Youtube, Smile } from 'lucide-react'

const icons = {
  inbox: Inbox,
  search: SearchX,
  folder: FolderPlus,
  hash: Hash,
  tv: Tv,
  calendar: Calendar,
  bell: Bell,
  check: CheckCircle,
  youtube: Youtube,
  smile: Smile,
}

const illustrations = {
  inbox: 'M12 2l-5 5h3v6h4V7h3L12 2zM5 14v4h14v-4H5z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  smile: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  tv: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
  calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
  check: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
}

export default function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description = '',
  action,
}) {
  const Icon = icons[icon] || Inbox
  const path = illustrations[icon] || illustrations.inbox

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-dark-700/50 to-dark-800/50 backdrop-blur-sm border border-dark-600/30 flex items-center justify-center shadow-xl">
          <Icon className="w-11 h-11 text-dark-400" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-dark-800 border border-dark-600/30 flex items-center justify-center">
          <Smile className="w-4 h-4 text-dark-500" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-dark-200 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-dark-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
