'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { subscribeNotifications, markNotificationRead } from '@/lib/firebase/firestore'
import { requestPushPermission } from '@/lib/firebase/messaging'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications(user.uid, setNotifications)
    if (typeof Notification !== 'undefined') {
      setPushStatus(Notification.permission as 'default' | 'granted' | 'denied')
    }
    return unsub
  }, [user])

  const handleEnablePush = async () => {
    if (!user) return
    setEnabling(true)
    const ok = await requestPushPermission(user.uid)
    setPushStatus(ok ? 'granted' : 'denied')
    setEnabling(false)
  }

  const handleClick = async (n: Notification) => {
    await markNotificationRead(n.id)
    if (n.relatedEntityType === 'workout') {
      window.location.href = `/workouts/${n.relatedEntityId}`
    } else if (n.relatedEntityType === 'strengthAssignment') {
      window.location.href = `/strength/${n.relatedEntityId}`
    } else if (n.relatedEntityType === 'annotation') {
      window.location.href = `/motion/${n.relatedEntityId}`
    }
  }

  return (
    <>
      <TopBar title="通知" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-4">
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
          pushStatus === 'granted'
            ? 'border-slate-700 bg-slate-800/50'
            : pushStatus === 'denied'
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-emerald-500/30 bg-emerald-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <BellRing className={`h-5 w-5 shrink-0 ${
              pushStatus === 'granted' ? 'text-slate-400' : pushStatus === 'denied' ? 'text-red-400' : 'text-emerald-400'
            }`} />
            <p className={`text-sm ${
              pushStatus === 'granted' ? 'text-slate-400' : pushStatus === 'denied' ? 'text-red-300' : 'text-emerald-300'
            }`}>
              {pushStatus === 'granted'
                ? 'プッシュ通知は有効です'
                : pushStatus === 'denied'
                ? 'ブラウザの設定で通知がブロックされています'
                : 'プッシュ通知を有効にするとリアルタイムで通知を受け取れます'}
            </p>
          </div>
          {pushStatus === 'default' && (
            <button
              onClick={handleEnablePush}
              disabled={enabling}
              className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {enabling ? '設定中...' : '通知を有効にする'}
            </button>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 w-full">
          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">未読の通知はありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className="w-full px-6 py-4 text-left hover:bg-slate-800/50"
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    {n.body && <p className="mt-1 text-xs text-slate-400">{n.body}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
