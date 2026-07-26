import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, BellOff, Trash2 } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, limit as limitQuery } from 'firebase/firestore'
import { db } from '../services/db'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../utils/helpers'

const notificationsRef = collection(db, 'notificationHistory')

export default function NotificationHistory() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limitQuery(100))
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsubscribe
  }, [])

  const handleClear = async (id) => {
    await deleteDoc(doc(db, 'notificationHistory', id))
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notification history?')) return
    for (const n of notifications) {
      await deleteDoc(doc(db, 'notificationHistory', n.id))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="text-dark-400 hover:text-dark-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-dark-100">Notification History</h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-red-400 rounded-xl text-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-dark-850/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No notifications yet"
          description="Notifications will appear here when new videos or episodes are found."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-4 bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-xl hover:border-dark-600/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100">{n.title}</p>
                <p className="text-xs text-dark-400 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-dark-500">
                    {n.createdAt?.toDate ? formatDate(n.createdAt.toDate()) : formatDate(n.createdAt)}
                  </span>
                  {n.type && (
                    <span className="px-1.5 py-0.5 bg-dark-800 rounded text-[10px] text-dark-400 uppercase">{n.type}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleClear(n.id)}
                className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                title="Dismiss"
              >
                <BellOff className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
