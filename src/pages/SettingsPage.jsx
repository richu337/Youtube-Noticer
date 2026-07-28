import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Bell,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Shield,
  Smartphone,
  Database,
  Volume2,
  Link,
  Send,
  Sun,
  Moon,
  History,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useToast } from '../components/ui/Toast'
import { playNotificationSound, clearCachedAudio } from '../utils/sound'

function SettingCard({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-dark-300" />
        </div>
        <div>
          <h3 className="font-semibold text-dark-100">{title}</h3>
          {description && (
            <p className="text-sm text-dark-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function PushNotificationCard() {
  const { enabled, supported, enable, disable } = usePushNotifications()

  if (!supported) return null

  return (
    <SettingCard
      icon={Send}
      title="Push Notifications"
      description="Receive notifications when new videos are found even when the app is closed."
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-dark-300">Push notifications</span>
          <button
            onClick={() => (enabled ? disable() : enable())}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              enabled ? 'bg-red-600' : 'bg-dark-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>
        {enabled && (
          <p className="text-xs text-green-400">
            Push notifications are active.
          </p>
        )}
      </div>
    </SettingCard>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings, update } = useSettings()
  const toast = useToast()

  const handleToggle = async (key, value) => {
    await update({ [key]: value })
    toast(`${key} updated`, 'success')
  }

  const handleIntervalChange = async (value) => {
    const num = parseInt(value)
    if (num < 5) return
    await update({ syncInterval: num })
    toast('Sync interval updated', 'success')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-dark-300" />
        <h1 className="text-2xl font-bold text-dark-100">Settings</h1>
      </div>

      <div className="space-y-4 max-w-2xl">
        <SettingCard
          icon={RefreshCw}
          title="Sync Settings"
          description="Configure how often series are checked for new videos."
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-300">Sync interval (minutes)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.syncInterval}
                onChange={(e) => handleIntervalChange(e.target.value)}
                className="w-20 px-3 py-1.5 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-dark-100 text-center focus:outline-none focus:border-red-500/50"
              />
              <span className="text-sm text-dark-400">min</span>
            </div>
          </div>
        </SettingCard>

        <SettingCard
          icon={Eye}
          title="Display"
          description="Control what you see on the dashboard."
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-dark-300">Show watched videos</span>
              <button
                onClick={() => handleToggle('showWatched', !settings.showWatched)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.showWatched ? 'bg-red-600' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showWatched ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-dark-700/20">
              <div className="flex items-center gap-2">
                {settings.theme === 'light' ? <Sun className="w-4 h-4 text-dark-400" /> : <Moon className="w-4 h-4 text-dark-400" />}
                <span className="text-sm text-dark-300">Theme</span>
              </div>
              <button
                onClick={() => handleToggle('theme', settings.theme === 'light' ? 'dark' : 'light')}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.theme === 'light' ? 'bg-yellow-500' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${
                    settings.theme === 'light' ? 'translate-x-5' : ''
                  }`}
                >
                  {settings.theme === 'light' ? (
                    <Sun className="w-3 h-3 text-yellow-500" />
                  ) : (
                    <Moon className="w-3 h-3 text-dark-600" />
                  )}
                </span>
              </button>
            </label>
          </div>
        </SettingCard>

        <SettingCard
          icon={Bell}
          title="Notification Sound"
          description="Play a sound when new videos are found during sync."
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-dark-300">Enable sound</span>
              <button
                onClick={() => handleToggle('notificationsEnabled', !settings.notificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-red-600' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link className="w-3.5 h-3.5 text-dark-400" />
                <span className="text-xs text-dark-400">Custom sound URL (optional)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/sound.mp3"
                  value={settings.notificationSoundUrl}
                  onChange={(e) => handleToggle('notificationSoundUrl', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-red-500/50"
                />
                <button
                  onClick={() => {
                    clearCachedAudio()
                    playNotificationSound(settings.notificationSoundUrl)
                  }}
                  className="px-3 py-1.5 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-dark-300 hover:text-dark-100 hover:border-dark-500 transition-all"
                  title="Test sound"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-dark-500 mt-1.5">
                Leave empty for default chime. Supports MP3, OGG, WAV URLs. Test before saving.
              </p>
            </div>
          </div>
        </SettingCard>

        <PushNotificationCard />

        <SettingCard
          icon={History}
          title="Notification History"
          description="View a log of past notifications."
        >
          <button
            onClick={() => navigate('/notifications')}
            className="w-full flex items-center justify-between px-4 py-3 bg-dark-800/50 border border-dark-700/30 rounded-xl hover:border-dark-600/50 transition-all text-sm text-dark-300 hover:text-dark-100"
          >
            <span>View notification history</span>
            <History className="w-4 h-4" />
          </button>
        </SettingCard>

        <SettingCard
          icon={History}
          title="Activity Feed"
          description="See a timeline of all events across the app."
        >
          <button
            onClick={() => navigate('/activity')}
            className="w-full flex items-center justify-between px-4 py-3 bg-dark-800/50 border border-dark-700/30 rounded-xl hover:border-dark-600/50 transition-all text-sm text-dark-300 hover:text-dark-100"
          >
            <span>View activity feed</span>
            <History className="w-4 h-4" />
          </button>
        </SettingCard>

        <SettingCard
          icon={Database}
          title="Data Management"
          description="Clean up old videos and manage storage."
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-dark-300">Auto cleanup old videos</span>
              <button
                onClick={() => handleToggle('autoCleanup', !settings.autoCleanup)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.autoCleanup ? 'bg-red-600' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoCleanup ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
            {settings.autoCleanup && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-300">Cleanup threshold</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={settings.autoCleanupDays || 30}
                    onChange={(e) => handleToggle('autoCleanupDays', parseInt(e.target.value))}
                    className="w-20 px-3 py-1.5 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-dark-100 text-center focus:outline-none focus:border-red-500/50"
                  />
                  <span className="text-sm text-dark-400">days</span>
                </div>
              </div>
            )}
            <p className="text-xs text-dark-500">
              Automatically remove videos older than {settings.autoCleanupDays || 30} days after each sync.
            </p>
          </div>
        </SettingCard>

        <SettingCard
          icon={Smartphone}
          title="About"
          description="App information."
        >
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Version</span>
              <span className="text-dark-200">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Platform</span>
              <span className="text-dark-200">Web / Android (Capacitor)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Database</span>
              <span className="text-dark-200">Firebase Firestore</span>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  )
}
