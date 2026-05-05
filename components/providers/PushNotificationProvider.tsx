'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { refreshPushToken } from '@/lib/firebase/messaging'

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/api/firebase-messaging-sw', { scope: '/' })
      .then(() => refreshPushToken(user.uid))
      .catch(() => {})
  }, [user])

  return <>{children}</>
}
