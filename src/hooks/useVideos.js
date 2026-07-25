import { useState, useEffect, useCallback } from 'react'
import {
  onVideosSnapshot,
  addVideo,
  markVideoWatched,
  markVideoUnwatched,
  getRecentVideosBySeries,
  deleteVideo,
} from '../services/db'

export function useVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onVideosSnapshot((data) => {
      setVideos(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const add = async (data) => {
    return await addVideo(data)
  }

  const markWatched = async (id) => {
    return await markVideoWatched(id)
  }

  const markUnwatched = async (id) => {
    return await markVideoUnwatched(id)
  }

  const getForSeries = useCallback(async (seriesId) => {
    return await getRecentVideosBySeries(seriesId, 2)
  }, [])

  const remove = async (id) => {
    return await deleteVideo(id)
  }

  return { videos, loading, add, markWatched, markUnwatched, getForSeries, remove }
}
