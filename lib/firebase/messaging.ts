import { doc, updateDoc } from 'firebase/firestore'
import { db } from './config'
import app from './config'

async function getSwRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  const existing = await navigator.serviceWorker.getRegistration('/api/firebase-messaging-sw')
  if (existing) return existing
  return navigator.serviceWorker.register('/api/firebase-messaging-sw', { scope: '/' })
}

export async function requestPushPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const { getMessaging, getToken } = await import('firebase/messaging')
    const serviceWorkerRegistration = await getSwRegistration()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })
    if (token) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token })
    }
    return !!token
  } catch {
    return false
  }
}

export async function refreshPushToken(userId: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (Notification.permission !== 'granted') return

  try {
    const { getMessaging, getToken } = await import('firebase/messaging')
    const serviceWorkerRegistration = await getSwRegistration()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })
    if (token) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token })
    }
  } catch {
    // best-effort
  }
}
