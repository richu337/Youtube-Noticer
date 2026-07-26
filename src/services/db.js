import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import app from './firebase'

const db = getFirestore(app)

// ---- Categories ----
export const categoriesRef = collection(db, 'categories')

export const getCategories = async () => {
  const snap = await getDocs(categoriesRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addCategory = async (data) => {
  return await addDoc(categoriesRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const updateCategory = async (id, data) => {
  return await updateDoc(doc(db, 'categories', id), data)
}

export const deleteCategory = async (id) => {
  return await deleteDoc(doc(db, 'categories', id))
}

export const onCategoriesSnapshot = (callback) => {
  return onSnapshot(
    query(categoriesRef, orderBy('name')),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
  )
}

// ---- Series ----
export const seriesRef = collection(db, 'series')

export const getSeries = async () => {
  const snap = await getDocs(seriesRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getSeriesByCategory = async (categoryId) => {
  const q = query(seriesRef, where('categoryId', '==', categoryId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addSeries = async (data) => {
  return await addDoc(seriesRef, {
    ...data,
    favorite: false,
    lastChecked: null,
    createdAt: serverTimestamp(),
  })
}

export const updateSeries = async (id, data) => {
  return await updateDoc(doc(db, 'series', id), data)
}

export const deleteSeries = async (id) => {
  const videos = await getVideosBySeries(id)
  for (const v of videos) {
    await deleteDoc(doc(db, 'videos', v.id))
  }
  return await deleteDoc(doc(db, 'series', id))
}

export const toggleFavorite = async (id, current) => {
  return await updateDoc(doc(db, 'series', id), { favorite: !current })
}

export const onSeriesSnapshot = (callback) => {
  return onSnapshot(seriesRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ---- Videos ----
export const videosRef = collection(db, 'videos')

export const getVideosBySeries = async (seriesId) => {
  const q = query(
    videosRef,
    where('seriesId', '==', seriesId),
    orderBy('publishedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getRecentVideosBySeries = async (seriesId, limitCount = 2) => {
  const q = query(
    videosRef,
    where('seriesId', '==', seriesId),
    orderBy('publishedAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getAllRecentVideos = async (videosLimit = 50) => {
  const q = query(videosRef, orderBy('publishedAt', 'desc'), limit(videosLimit))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addVideo = async (data) => {
  const q = query(
    videosRef,
    where('videoId', '==', data.videoId),
    where('seriesId', '==', data.seriesId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }
  return await addDoc(videosRef, {
    ...data,
    watched: false,
    createdAt: serverTimestamp(),
  })
}

export const updateVideo = async (id, data) => {
  return await updateDoc(doc(db, 'videos', id), data)
}

export const markVideoWatched = async (id) => {
  return await updateDoc(doc(db, 'videos', id), { watched: true })
}

export const markVideoUnwatched = async (id) => {
  return await updateDoc(doc(db, 'videos', id), { watched: false })
}

export const getVideoByVideoId = async (videoId) => {
  const q = query(videosRef, where('videoId', '==', videoId), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export const deleteVideo = async (id) => {
  return await deleteDoc(doc(db, 'videos', id))
}

export const onVideosSnapshot = (callback) => {
  return onSnapshot(videosRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const getVideosBySeriesId = async (seriesId, limitCount = 2) => {
  const q = query(
    videosRef,
    where('seriesId', '==', seriesId),
    orderBy('publishedAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---- Push Tokens ----
export const pushTokensRef = collection(db, 'pushTokens')

export const addPushToken = async (token) => {
  const q = query(pushTokensRef, where('token', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) {
    await addDoc(pushTokensRef, { token, createdAt: serverTimestamp() })
  }
}

export const removePushToken = async (token) => {
  const q = query(pushTokensRef, where('token', '==', token))
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'pushTokens', d.id))
  }
}

// ---- Anime ----
export const animeRef = collection(db, 'anime')

export const addAnime = async (data) => {
  return await addDoc(animeRef, {
    ...data,
    lastNotifiedEpisode: 0,
    createdAt: serverTimestamp(),
  })
}

export const updateAnime = async (id, data) => {
  return await updateDoc(doc(db, 'anime', id), data)
}

export const onAnimeSnapshot = (callback) => {
  return onSnapshot(animeRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ---- Anime Episodes ----
export const animeEpisodesRef = collection(db, 'animeEpisodes')

export const getAnimeEpisodes = async (animeDocId) => {
  const q = query(
    animeEpisodesRef,
    where('animeDocId', '==', animeDocId),
    orderBy('episode', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const onAnimeEpisodesSnapshot = (callback) => {
  return onSnapshot(animeEpisodesRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const addAnimeEpisodes = async (data) => {
  const q = query(
    animeEpisodesRef,
    where('animeDocId', '==', data.animeDocId),
    where('episode', '==', data.episode),
    limit(1)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }
  return await addDoc(animeEpisodesRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const deleteAnime = async (id) => {
  const episodes = await getAnimeEpisodes(id)
  for (const ep of episodes) {
    await deleteDoc(doc(db, 'animeEpisodes', ep.id))
  }
  return await deleteDoc(doc(db, 'anime', id))
}

// ---- Notification History ----
export const notificationHistoryRef = collection(db, 'notificationHistory')

export const addNotificationHistory = async (data) => {
  return await addDoc(notificationHistoryRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export { db }
