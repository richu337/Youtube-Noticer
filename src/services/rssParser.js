import { getYoutubeThumbnail, getYoutubeVideoUrl } from '../utils/helpers'

const parseRSSItem = (item) => {
  const getNodeText = (entry, tag) => {
    const node = entry.getElementsByTagName(tag)[0]
    return node ? node.textContent : ''
  }

  const getNodeAttr = (entry, tag, attr) => {
    const node = entry.getElementsByTagName(tag)[0]
    return node ? node.getAttribute(attr) : ''
  }

  const videoId = getNodeText(item, 'yt:videoId') ||
    getNodeAttr(item, 'yt:videoid', 'videoid') || ''

  const title = getNodeText(item, 'title') || ''
  const publishedAt = getNodeText(item, 'published') ||
    getNodeText(item, 'pubDate') || ''
  const authorNode = item.getElementsByTagName('author')[0]
  const author = authorNode?.getElementsByTagName('name')[0]?.textContent || ''

  return {
    videoId,
    title,
    publishedAt,
    author,
    thumbnail: getYoutubeThumbnail(videoId),
    youtubeUrl: getYoutubeVideoUrl(videoId),
  }
}

const fetchAndParse = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const xmlText = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

  const root = xmlDoc.documentElement
  if (!root || root.nodeName !== 'feed') {
    throw new Error(`Response is not an RSS feed: ${url}`)
  }

  const items = xmlDoc.getElementsByTagName('entry')
  const entries = []

  for (let i = 0; i < items.length; i++) {
    entries.push(parseRSSItem(items[i]))
  }

  return entries
}

export const fetchChannelRSS = async (channelId) => {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const proxyUrl = import.meta.env.VITE_RSS_PROXY_URL

  const urls = []

  if (proxyUrl) {
    urls.push(`${proxyUrl}?url=${encodeURIComponent(rssUrl)}`)
  }

  urls.push(`/youtube-rss?channel_id=${channelId}`)
  urls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`)

  for (const url of urls) {
    try {
      const entries = await fetchAndParse(url)
      if (entries.length > 0) return entries
    } catch (error) {
      console.warn(`RSS fetch failed for ${url}:`, error)
    }
  }

  try {
    return await fetchAndParse(rssUrl)
  } catch (directError) {
    console.error('Direct RSS fetch also failed:', directError)
    return []
  }
}

export const getEffectiveKeywords = (series) => {
  const keywords = [...(series.keywords || [])]
  if (series.name) {
    const nameTrimmed = series.name.toLowerCase().trim()
    const hasName = keywords.some((k) => k.toLowerCase().trim() === nameTrimmed)
    if (!hasName) {
      keywords.push(series.name)
    }
  }
  return keywords
}

export const filterVideosByKeywords = (videos, keywords) => {
  if (!keywords || keywords.length === 0) return videos

  const lowerKeywords = keywords.map((k) => k.toLowerCase().trim())

  return videos.filter((video) => {
    const title = video.title.toLowerCase()
    return lowerKeywords.some((keyword) => title.includes(keyword))
  })
}

export const fetchAndFilterSeriesVideos = async (series) => {
  if (!series.channelId) return []

  const allVideos = await fetchChannelRSS(series.channelId)
  const effectiveKeywords = getEffectiveKeywords(series)
  const filtered = filterVideosByKeywords(allVideos, effectiveKeywords)

  return filtered.slice(0, 10)
}
