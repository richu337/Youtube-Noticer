export function VideoCardSkeleton() {
  return (
    <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-dark-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-dark-700 rounded-full w-3/4" />
        <div className="h-3 bg-dark-700 rounded-full w-1/2" />
        <div className="h-3 bg-dark-700 rounded-full w-1/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-dark-700 rounded-lg flex-1" />
          <div className="h-8 bg-dark-700 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  )
}

export function SeriesCardSkeleton() {
  return (
    <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-5 bg-dark-700 rounded-full w-1/2" />
        <div className="h-3 bg-dark-700 rounded-full w-1/3" />
        <div className="aspect-video bg-dark-700 rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 bg-dark-700 rounded-full w-full" />
          <div className="h-3 bg-dark-700 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <SeriesCardSkeleton key={i} />
      ))}
    </div>
  )
}
