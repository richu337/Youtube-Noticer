import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import app from './firebase'

const auth = getAuth(app)

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error('Anonymous login failed:', error)
    return null
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export default auth
