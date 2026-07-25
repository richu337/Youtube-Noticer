import { useState, useEffect, useCallback } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '../services/firebase'
import { addPushToken, removePushToken } from '../services/db'

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY

export function usePushNotifications() {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('pushEnabled') === 'true'
  )
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      !!messaging
    )
  }, [])

  useEffect(() => {
    if (!supported || !messaging || !enabled) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground push:', payload)
    })

    return () => unsubscribe()
  }, [supported, enabled])

  const enable = useCallback(async () => {
    if (!supported || !messaging) return false

    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return false

      const registration = await navigator.serviceWorker.getRegistration()
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      await addPushToken(fcmToken)
      localStorage.setItem('pushEnabled', 'true')
      setEnabled(true)
      return true
    } catch (err) {
      console.error('Failed to enable push:', err)
      return false
    }
  }, [supported])

  const disable = useCallback(async () => {
    if (!messaging) return

    try {
      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (fcmToken) {
        await removePushToken(fcmToken)
      }
    } catch {
      // token might not exist, ignore
    }

    localStorage.setItem('pushEnabled', 'false')
    setEnabled(false)
  }, [])

  return { enabled, supported, enable, disable }
}
