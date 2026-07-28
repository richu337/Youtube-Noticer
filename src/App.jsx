import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import SplashScreen from './components/ui/SplashScreen'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import SeriesManagement from './pages/SeriesManagement'
import SeriesVideos from './pages/SeriesVideos'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'
import AnimeManagement from './pages/AnimeManagement'
import NotificationHistory from './pages/NotificationHistory'
import CalendarPage from './pages/Calendar'
import ActivityFeed from './pages/ActivityFeed'
import DashboardCustomization from './pages/DashboardCustomization'

function useRegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const params = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })

    navigator.serviceWorker
      .register(`/firebase-messaging-sw.js?${params.toString()}`)
      .catch((err) => console.warn('SW registration failed:', err))
  }, [])
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  useRegisterSW()

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/series" element={<SeriesManagement />} />
            <Route path="/series/:id" element={<SeriesVideos />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/anime" element={<AnimeManagement />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationHistory />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/activity" element={<ActivityFeed />} />
            <Route path="/customize" element={<DashboardCustomization />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
