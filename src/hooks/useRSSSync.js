import { useState, useCallback } from 'react'
import { getDocs } from 'firebase/firestore'
import { fetchAndFilterSeriesVideos, filterVideosByKeywords, getEffectiveKeywords } from '../services/rssParser'
import { addVideo, updateSeries, deleteVideo, getVideosBySeries, videosRef, addNotificationHistory } from '../services/db'
import { playNotificationSound } from '../utils/sound'

export function useRSSSync() {
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState('')

  const syncSeries = useCallback(async (series) => {
    setProgress(`Fetching RSS for ${series.name}...`)
    const videos = await fetchAndFilterSeriesVideos(series)

    if (videos.length === 0) {
      setProgress('')
      return []
    }

    const savedVideos = []
    for (const video of videos) {
      try {
        const saved = await addVideo({
          videoId: video.videoId,
          seriesId: series.id,
          title: video.title,
          thumbnail: video.thumbnail,
          publishedAt: video.publishedAt,
          youtubeUrl: video.youtubeUrl,
          channelName: video.author,
        })
        if (saved) savedVideos.push(saved)
      } catch (e) {
        console.warn(`Skipping duplicate video: ${video.videoId}`)
      }
    }

    if (savedVideos.length > 0) {
      if (series.notificationSoundUrl) {
        playNotificationSound(series.notificationSoundUrl)
      }
      for (const v of savedVideos) {
        addNotificationHistory({
          type: 'new_video',
          seriesId: series.id,
          seriesName: series.name,
          title: v.title ? `New video: ${v.title.substring(0, 80)}` : 'New video found',
          message: `${series.name} - ${v.channelName || series.channelName}`,
        }).catch(() => {})
      }
    }

    const effectiveKeywords = getEffectiveKeywords(series)
    if (effectiveKeywords.length) {
      const existingVideos = await getVideosBySeries(series.id)
      const matching = filterVideosByKeywords(existingVideos, effectiveKeywords)
      const matchingIds = new Set(matching.map((v) => v.id))
      for (const v of existingVideos) {
        if (!matchingIds.has(v.id)) {
          await deleteVideo(v.id)
        }
      }
    }

    return savedVideos
  }, [])

  const syncAll = useCallback(async (seriesList, options = {}) => {
    setSyncing(true)
    setProgress('Starting sync...')

    let totalNew = 0
    let customSoundPlayed = false
    const total = seriesList.length
    for (let i = 0; i < total; i++) {
      const s = seriesList[i]
      const saved = await syncSeries(s)
      totalNew += saved.length
      if (saved.length > 0 && s.notificationSoundUrl) {
        customSoundPlayed = true
      }
      await updateSeries(s.id, { lastChecked: new Date().toISOString() })
      setProgress(`Synced ${i + 1}/${total}: ${s.name}`)
    }

    if (totalNew > 0 && !customSoundPlayed && options.notificationsEnabled !== false) {
      playNotificationSound(options.notificationSoundUrl)
    }

    setProgress('Sync complete!')
    setSyncing(false)
    setProgress('')

    return true
  }, [syncSeries])

  const cleanupOldVideos = useCallback(async (days = 30) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString()

    const snap = await getDocs(videosRef)
    const toDelete = snap.docs.filter((d) => {
      const data = d.data()
      return data.publishedAt && data.publishedAt < cutoffStr
    })

    for (const d of toDelete) {
      await deleteVideo(d.id)
    }

    return toDelete.length
  }, [])

  return { syncing, progress, syncSeries, syncAll, cleanupOldVideos }
}
