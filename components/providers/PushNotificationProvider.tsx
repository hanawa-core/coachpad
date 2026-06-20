'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { refreshPushToken } from '@/lib/firebase/messaging'
import {
  subscribeNotifications,
  subscribeChatThreads,
  computeUnreadCount,
} from '@/lib/firebase/firestore'

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  // Service Worker 登録 + プッシュトークン更新
  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/api/firebase-messaging-sw', { scope: '/' })
      .then(() => refreshPushToken(user.uid))
      .catch(() => {})
  }, [user])

  // アプリアイコンのバッジ（未読通知 + 未読チャット件数）
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    if (!user) {
      nav.clearAppBadge?.().catch(() => {})
      return
    }

    let notifCount = 0
    let chatCount = 0
    const apply = () => {
      const total = notifCount + chatCount
      if (total > 0) nav.setAppBadge?.(total).catch(() => {})
      else nav.clearAppBadge?.().catch(() => {})
    }

    const unsubN = subscribeNotifications(user.uid, (ns) => {
      notifCount = ns.length
      apply()
    })
    const unsubC = subscribeChatThreads(user.uid, (threads) => {
      chatCount = threads.reduce((s, t) => s + computeUnreadCount(t, user.uid), 0)
      apply()
    })

    return () => {
      unsubN()
      unsubC()
      nav.clearAppBadge?.().catch(() => {})
    }
  }, [user])

  return <>{children}</>
}
