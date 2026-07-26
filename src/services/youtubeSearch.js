const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function searchChannels(query) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Set VITE_YOUTUBE_API_KEY in .env')
  }

  const url = `${YT_API_BASE}/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
  const data = await res.json()

  return (data.items || []).map((item) => ({
    id: item.snippet.channelId,
    title: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.default?.url || '',
    publishedAt: item.snippet.publishTime,
  }))
}

export async function getChannelDetails(channelId) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) return null

  const url = `${YT_API_BASE}/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.items?.length) return null

  const item = data.items[0]
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.default?.url || '',
    subscriberCount: item.statistics?.subscriberCount || '0',
    videoCount: item.statistics?.videoCount || '0',
  }
}
