import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import Navbar from './Navbar'
import { useSeries } from '../../hooks/useSeries'
import { useRSSSync } from '../../hooks/useRSSSync'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../ui/Toast'

export default function AppLayout() {
  const { series } = useSeries()
  const { syncing, progress, syncAll, cleanupOldVideos } = useRSSSync()
  const { settings } = useSettings()
  const toast = useToast()

  const handleSync = useCallback(async () => {
    if (syncing || series.length === 0) return
    toast('Starting RSS sync...', 'info')
    const newVideos = await syncAll(series, {
      notificationSoundUrl: settings.notificationSoundUrl,
      notificationsEnabled: settings.notificationsEnabled,
    })
    if (newVideos) {
      toast('Sync complete! New videos have been added.', 'success')
    }
    if (settings.autoCleanup) {
      const deleted = await cleanupOldVideos(settings.autoCleanupDays || 30)
      if (deleted > 0) {
        toast(`Cleaned up ${deleted} old video(s)`, 'info')
      }
    }
  }, [syncing, series, syncAll, settings.notificationSoundUrl, settings.notificationsEnabled, settings.autoCleanup, settings.autoCleanupDays, cleanupOldVideos, toast])

  const syncRef = useRef()
  syncRef.current = async () => {
    if (series.length === 0) return
    await syncAll(series, {
      notificationSoundUrl: settings.notificationSoundUrl,
      notificationsEnabled: settings.notificationsEnabled,
    })
    if (settings.autoCleanup) {
      await cleanupOldVideos(settings.autoCleanupDays || 30)
    }
  }

  useEffect(() => {
    if (settings.syncInterval < 5) return

    const ms = settings.syncInterval * 60 * 1000
    const id = setInterval(() => syncRef.current(), ms)

    return () => clearInterval(id)
  }, [settings.syncInterval, settings.autoCleanup, settings.autoCleanupDays])

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 font-sans">
      <Navbar onSync={handleSync} syncing={syncing} />

      {syncing && progress && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-dark-850/90 backdrop-blur-md border border-dark-700/50 rounded-xl px-5 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
            <span className="text-sm text-dark-200">{progress}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pt-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
