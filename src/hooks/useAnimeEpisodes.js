import { useState, useEffect } from 'react'
import { onAnimeEpisodesSnapshot } from '../services/db'

export function useAnimeEpisodes() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAnimeEpisodesSnapshot((data) => {
      setEpisodes(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const getForAnime = (animeDocId) => {
    return episodes.filter((e) => e.animeDocId === animeDocId)
  }

  return { episodes, loading, getForAnime }
}
