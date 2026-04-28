'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { subscribeNotifications, markNotificationRead } from '@/lib/firebase/firestore'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications(user.uid, setNotifications)
    return unsub
  }, [user])

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
      <div className="p-6 max-w-2xl">
        <div className="rounded-xl border border-slate-800 bg-slate-900">
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
