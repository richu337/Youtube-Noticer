import admin from 'firebase-admin'
import cron from 'node-cron'
import { XMLParser } from 'fast-xml-parser'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __dirname = dirname(fileURLToPath(import.meta.url))

let serviceAccount
try {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT
  if (envJson) {
    serviceAccount = JSON.parse(envJson)
  } else {
    serviceAccount = JSON.parse(
      readFileSync(join(__dirname, 'service-account.json'), 'utf-8')
    )
  }
} catch {
  console.error('Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT env var or add server/service-account.json')
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

// ---- AniList API ----
const ANILIST_API = 'https://graphql.anilist.co'

async function queryAniList(query, variables) {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!response.ok) throw new Error(`AniList HTTP ${response.status}`)
  const json = await response.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json
}

async function syncAnimeAndNotify() {
  console.log('[Anime Sync] Starting...')

  const animeSnap = await db.collection('anime').get()
  const animeList = animeSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`[Anime Sync] Found ${animeList.length} anime`)

  const newEpisodes = []

  for (const anime of animeList) {
    if (!anime.anilistId) continue

    try {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            title { romaji english }
            episodes
            status
            airingSchedule(perPage: 100) {
              nodes { airingAt episode }
            }
          }
        }
      `
      const result = await queryAniList(query, { id: anime.anilistId })
      const media = result.data.Media
      if (!media || !media.airingSchedule?.nodes) continue

      const now = Math.floor(Date.now() / 1000)
      const lastNotified = anime.lastNotifiedEpisode || 0

      for (const node of media.airingSchedule.nodes) {
        if (node.airingAt <= now && node.episode > lastNotified) {
          // Check if already saved
          const existingSnap = await db
            .collection('animeEpisodes')
            .where('animeDocId', '==', anime.id)
            .where('episode', '==', node.episode)
            .get()

          if (existingSnap.empty) {
            newEpisodes.push({
              animeDocId: anime.id,
              animeTitle: media.title.romaji || media.title.english || 'Unknown',
              episode: node.episode,
              airingAt: new Date(node.airingAt * 1000).toISOString(),
              coverImage: anime.coverImage || '',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }
        }
      }
    } catch (err) {
      console.error(`[Anime Sync] Error for ${anime.title || anime.anilistId}:`, err.message)
    }
  }

  console.log(`[Anime Sync] Found ${newEpisodes.length} new episodes`)

  if (newEpisodes.length === 0) {
    console.log('[Anime Sync] No new episodes')
    return
  }

  // Save new episodes
  const batch = db.batch()
  for (const ep of newEpisodes) {
    const ref = db.collection('animeEpisodes').doc()
    batch.set(ref, ep)
  }
  await batch.commit()
  console.log(`[Anime Sync] Saved ${newEpisodes.length} episodes`)

  // Update lastNotifiedEpisode for each anime
  const updates = {}
  for (const ep of newEpisodes) {
    const key = ep.animeDocId
    if (!updates[key] || ep.episode > updates[key]) {
      updates[key] = ep.episode
    }
  }
  for (const [animeId, episode] of Object.entries(updates)) {
    await db.collection('anime').doc(animeId).update({
      lastNotifiedEpisode: episode,
    })
  }

  // Send push notifications
  const tokensSnap = await db.collection('pushTokens').get()
  const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean)

  if (tokens.length === 0) {
    console.log('[Anime Push] No tokens registered')
    return
  }

  const names = [...new Set(newEpisodes.map((e) => e.animeTitle))].slice(0, 3)
  const body =
    newEpisodes.length === 1
      ? `${newEpisodes[0].animeTitle} Episode ${newEpisodes[0].episode} is now airing!`
      : names.join(', ') + (newEpisodes.length > 3 ? '...' : '')

  const message = {
    notification: {
      title: `📺 ${newEpisodes.length} new anime episode${newEpisodes.length > 1 ? 's' : ''}`,
      body,
    },
    tokens,
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message)
    console.log(
      `[Anime Push] Sent to ${response.successCount} devices, ${response.failureCount} failures`
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
        console.log(`[Anime Push] Cleaned up ${invalidTokens.length} invalid tokens`)
      }
    }
  } catch (err) {
    console.error('[Anime Push] Failed:', err.message)
  }

  console.log('[Anime Sync] Complete')
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  syncAndNotify().catch(console.error)
})

// Run anime sync every 30 minutes (staggered 5 min after YouTube sync)
cron.schedule('5,35 * * * *', () => {
  syncAnimeAndNotify().catch(console.error)
})

// Minimal HTTP server for Render (needs a port to keep Web Service alive)
const PORT = process.env.PORT || 3000
http
  .createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
  })
  .listen(PORT, () => {
    console.log(`[Server] Health endpoint listening on port ${PORT}`)
  })

const SELF_URL = process.env.SELF_URL || process.env.RENDER_EXTERNAL_URL || ''
if (SELF_URL) {
  const pingSelf = async () => {
    try {
      const res = await fetch(SELF_URL)
      if (!res.ok) console.warn(`[KeepAlive] Self-ping returned HTTP ${res.status}`)
    } catch (err) {
      console.warn('[KeepAlive] Self-ping failed:', err.message)
    }
  }
  setInterval(pingSelf, 10 * 60 * 1000)
  pingSelf()
  console.log(`[KeepAlive] Self-ping enabled every 10 min -> ${SELF_URL}`)
} else {
  console.log('[KeepAlive] No SELF_URL set; use an external pinger (e.g. cron-job.org) to keep the service awake')
}

console.log('[Server] Push notification schedulers started (every 30 min)')
