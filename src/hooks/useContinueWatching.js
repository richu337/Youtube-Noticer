import { useState, useEffect } from 'react'
import { onContinueWatchingSnapshot, addContinueWatching } from '../services/db'

export function useContinueWatching() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onContinueWatchingSnapshot((data) => {
      setItems(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const logWatch = async (data) => {
    return await addContinueWatching(data)
  }

  return { items, loading, logWatch }
}
