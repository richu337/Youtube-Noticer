import { db } from './firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { fetchAiringSchedules } from './anilist'

let widgetBridge = null

async function getWidgetBridge() {
  if (widgetBridge) return widgetBridge
  try {
    const { Plugins } = await import('@capacitor/core')
    widgetBridge = Plugins.WidgetBridge
    return widgetBridge
  } catch {
    return null
  }
}

export async function updateWidgetData(animeList) {
  try {
    const bridge = await getWidgetBridge()
    if (!bridge) return

    const videosSnap = await getDocs(
      query(collection(db, 'videos'), orderBy('publishedAt', 'desc'), limit(500))
    )
    const allVideos = videosSnap.docs.map((d) => d.data())
    const unwatchedCount = allVideos.filter((v) => !v.watched).length

    const animeSnap = await getDocs(collection(db, 'anime'))
    const trackedAnime = animeSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const anilistIds = trackedAnime.map((a) => a.anilistId).filter(Boolean)

    let airingCount = 0
    let nextRelease = '--'
    let countdown = ''
    let nextTitle = 'No upcoming'

    if (anilistIds.length > 0) {
      const mediaList = await fetchAiringSchedules(anilistIds)
      const now = Date.now()
      let nearest = null

      for (const media of mediaList) {
        const schedule = media.airingSchedule?.nodes || []
        for (const ep of schedule) {
          const airingAt = ep.airingAt * 1000
          if (airingAt > now) {
            airingCount++
            if (!nearest || airingAt < nearest.airingAt) {
              nearest = {
                title: media.title?.romaji || media.title?.english || 'Unknown',
                episode: ep.episode,
                airingAt,
              }
            }
          }
        }
      }

      if (nearest) {
        const diff = nearest.airingAt - now
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        nextRelease = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        countdown = nearest.airingAt.toString()
        nextTitle = `Ep ${nearest.episode} · ${nearest.title}`
      }
    }

    const root = document.documentElement
    const theme = root.getAttribute('data-theme') || 'dark'

    await bridge.updateWidget({
      videoCount: unwatchedCount,
      animeCount: airingCount,
      nextRelease,
      countdown,
      nextTitle,
      theme,
    })
  } catch {
    // Widget update failed silently
  }
}

export function startWidgetAutoRefresh() {
  updateWidgetData()
  setInterval(updateWidgetData, 1800000)
}