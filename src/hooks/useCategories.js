import { useState, useEffect } from 'react'
import { onCategoriesSnapshot, addCategory, updateCategory, deleteCategory } from '../services/db'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onCategoriesSnapshot((data) => {
      setCategories(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const create = async (data) => {
    return await addCategory(data)
  }

  const update = async (id, data) => {
    return await updateCategory(id, data)
  }

  const remove = async (id) => {
    return await deleteCategory(id)
  }

  return { categories, loading, create, update, remove }
}
