import { useState } from 'react'
import { Plus, Edit3, Trash2, Palette } from 'lucide-react'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { useCategories } from '../hooks/useCategories'
import { useToast } from '../components/ui/Toast'

const presetColors = [
  '#4ade80', '#f97316', '#a855f7', '#3b82f6', '#ec4899',
  '#6b7280', '#ef4444', '#eab308', '#14b8a6', '#8b5cf6',
]

const emptyForm = { name: '', color: '#6b7280' }

export default function CategoriesPage() {
  const { categories, loading, create, update, remove } = useCategories()
  const toast = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color || '#6b7280' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Category name is required', 'error')
      return
    }

    try {
      if (editing) {
        await update(editing.id, form)
        toast('Category updated', 'success')
      } else {
        await create(form)
        toast('Category created', 'success')
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch {
      toast('Failed to save category', 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return
    await remove(id)
    toast('Category deleted', 'info')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No categories yet"
          description="Create categories to organize your series and keep everything tidy."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5 hover:border-dark-600/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: cat.color || '#6b7280' + '20' }}
                >
                  <Palette
                    className="w-5 h-5"
                    style={{ color: cat.color || '#6b7280' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-100">{cat.name}</h3>
                  <span
                    className="inline-block w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: cat.color || '#6b7280' }}
                  />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700/50 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all"
              placeholder="e.g., Minecraft"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    form.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-850 scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-10 rounded-lg bg-transparent border border-dark-700/50 cursor-pointer"
              />
              <span className="text-sm text-dark-400">{form.color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm font-medium transition-all border border-dark-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-600/20"
            >
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
