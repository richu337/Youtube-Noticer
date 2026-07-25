import admin from 'firebase-admin'
import cron from 'node-cron'
import { XMLParser } from 'fast-xml-parser'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let serviceAccount
try {
  serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'service-account.json'), 'utf-8')
  )
} catch {
  console.error('Missing server/service-account.json. See server/.env.example')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const BATCH_SIZE = 10
const proxyUrl = process.env.RSS_PROXY_URL || ''

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function matchesKeywords(title, keywords) {
  if (!keywords || keywords.length === 0) return true
  const lower = title.toLowerCase()
  return keywords.some((k) => lower.includes(k.toLowerCase().trim()))
}

function getEffectiveKeywords(series) {
  const keywords = [...(series.keywords || [])]
  if (series.name) {
    const trimmed = series.name.toLowerCase().trim()
    const hasName = keywords.some((k) => k.toLowerCase().trim() === trimmed)
    if (!hasName) keywords.push(series.name)
  }
  return keywords
}

async function fetchRSS(channelId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const url = proxyUrl
    ? `${proxyUrl}?url=${encodeURIComponent(rssUrl)}`
    : rssUrl

  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const xmlText = await response.text()
  const parsed = xmlParser.parse(xmlText)
  const entries = parsed.feed?.entry || []

  return entries.map((entry) => ({
    videoId: entry['yt:videoId'] || '',
    title: entry.title || '',
    publishedAt: entry.published || entry.pubDate || '',
    author: entry.author?.name || entry.author || '',
  }))
}

async function syncAndNotify() {
  console.log('[Sync] Starting...')

  const seriesSnap = await db.collection('series').get()
  const series = seriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`[Sync] Found ${series.length} series`)

  const existingVideosSnap = await db.collection('videos').get()
  const existingVideoKeys = new Set()
  existingVideosSnap.docs.forEach((d) => {
    const data = d.data()
    existingVideoKeys.add(`${data.seriesId}_${data.videoId}`)
  })

  const newVideos = []

  for (let i = 0; i < series.length; i += BATCH_SIZE) {
    const batch = series.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (s) => {
        if (!s.channelId) return []
        const entries = await fetchRSS(s.channelId)
        const keywords = getEffectiveKeywords(s)
        const filtered = keywords.length
          ? entries.filter((e) => matchesKeywords(e.title, keywords))
          : entries
        return filtered
          .filter((e) => !existingVideoKeys.has(`${s.id}_${e.videoId}`))
          .map((e) => ({ ...e, seriesId: s.id }))
      })
    )
    for (const result of results) {
      if (result.status === 'fulfilled') {
        newVideos.push(...result.value)
      } else {
        console.error('[Sync] Batch error:', result.reason)
      }
    }
  }

  console.log(`[Sync] Found ${newVideos.length} new videos`)

  if (newVideos.length === 0) {
    console.log('[Sync] No new videos')
    return
  }

  // Save new videos
  const batch = db.batch()
  for (const v of newVideos) {
    const ref = db.collection('videos').doc()
    batch.set(ref, {
      videoId: v.videoId,
      seriesId: v.seriesId,
      title: v.title,
      thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      publishedAt: v.publishedAt,
      youtubeUrl: `https://youtube.com/watch?v=${v.videoId}`,
      channelName: v.author,
      watched: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  console.log(`[Sync] Saved ${newVideos.length} videos`)

  // Send push notifications
  const tokensSnap = await db.collection('pushTokens').get()
  const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean)

  if (tokens.length === 0) {
    console.log('[Push] No tokens registered')
    return
  }

  const titles = newVideos.slice(0, 3).map((v) => v.title)
  const body =
    titles.join(', ') + (newVideos.length > 3 ? '...' : '')

  const message = {
    notification: {
      title: `${newVideos.length} new video${newVideos.length > 1 ? 's' : ''}`,
      body,
    },
    tokens,
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message)
    console.log(
      `[Push] Sent to ${response.successCount} devices, ${response.failureCount} failures`
    )

    if (response.failureCount > 0) {
      const invalidTokens = []
      response.responses.forEach((resp, idx) => {
        const code = resp.error?.code
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx])
        }
      })
      if (invalidTokens.length > 0) {
        const tokenDocs = tokensSnap.docs.filter((d) =>
          invalidTokens.includes(d.data().token)
        )
        for (const doc of tokenDocs) {
          await doc.ref.delete()
        }
        console.log(`[Push] Cleaned up ${invalidTokens.length} invalid tokens`)
      }
    }
  } catch (err) {
    console.error('[Push] Failed:', err.message)
  }

  console.log('[Sync] Complete')
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  syncAndNotify().catch(console.error)
})

console.log('[Server] Push notification scheduler started (every 30 min)')
