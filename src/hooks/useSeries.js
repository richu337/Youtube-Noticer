import { useState, useEffect } from 'react'
import {
  onSeriesSnapshot,
  addSeries,
  updateSeries,
  deleteSeries,
  toggleFavorite,
} from '../services/db'

export function useSeries() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSeriesSnapshot((data) => {
      setSeries(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const create = async (data) => {
    return await addSeries(data)
  }

  const update = async (id, data) => {
    return await updateSeries(id, data)
  }

  const remove = async (id) => {
    return await deleteSeries(id)
  }

  const toggleFav = async (id, current) => {
    return await toggleFavorite(id, current)
  }

  return { series, loading, create, update, remove, toggleFav }
}
