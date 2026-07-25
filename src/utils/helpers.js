import { formatDistanceToNow, parseISO } from 'date-fns'
import { RSS_BASE_URL } from './constants'

export const generateRssUrl = (channelId) => {
  return `${RSS_BASE_URL}${channelId}`
}

export const extractChannelId = (rssUrl) => {
  const match = rssUrl.match(/channel_id=([^&]+)/)
  return match ? match[1] : ''
}

export const timeAgo = (dateString) => {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString.toDate()
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ''
  }
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export const truncateText = (text, maxLength = 60) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getYoutubeVideoUrl = (videoId) => {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export const getYoutubeThumbnail = (videoId, quality = 'hqdefault') => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

export const categoryColors = {
  Minecraft: '#4ade80',
  Palworld: '#f97316',
  ATM10: '#a855f7',
  Tech: '#3b82f6',
  Anime: '#ec4899',
  Others: '#6b7280',
}

export const getCategoryColor = (name) => {
  return categoryColors[name] || '#6b7280'
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}
