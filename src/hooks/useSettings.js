import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../services/db'

const SETTINGS_DOC = 'app_settings'

export function useSettings() {
  const [settings, setSettings] = useState({
    syncInterval: 30,
    showWatched: true,
    autoCleanup: false,
    autoCleanupDays: 30,
    notificationsEnabled: false,
    notificationSoundUrl: '',
    theme: 'dark',
    dashboardLayout: {
      sections: [
        { id: 'hero-banner', enabled: true },
        { id: 'dashboard-widgets', enabled: true },
        { id: 'filter-bar', enabled: true },
        { id: 'series-grid', enabled: true },
      ],
      layoutMode: 'comfortable',
      cardRadius: 16,
      cardSpacing: 24,
      gridDensity: 'normal',
      accentColor: '#ef4444',
      animationSpeed: 'normal',
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'settings', SETTINGS_DOC)

    const init = async () => {
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, settings)
      } else {
        setSettings(snap.data())
      }
      setLoading(false)
    }

    init()

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data())
      }
    })

    return () => unsubscribe()
  }, [])

  const update = async (data) => {
    const ref = doc(db, 'settings', SETTINGS_DOC)
    await setDoc(ref, data, { merge: true })
    setSettings((prev) => ({ ...prev, ...data }))
  }

  return { settings, loading, update }
}
