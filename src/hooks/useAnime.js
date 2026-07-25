import { useState, useEffect } from 'react'
import {
  onAnimeSnapshot,
  addAnime,
  deleteAnime,
  updateAnime,
} from '../services/db'

export function useAnime() {
  const [animeList, setAnimeList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAnimeSnapshot((data) => {
      setAnimeList(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const create = async (data) => {
    return await addAnime(data)
  }

  const remove = async (id) => {
    return await deleteAnime(id)
  }

  const update = async (id, data) => {
    return await updateAnime(id, data)
  }

  return { animeList, loading, create, remove, update }
}
