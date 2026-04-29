'use client'

import { Bell, Menu } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { subscribeNotifications } from '@/lib/firebase/firestore'
import { useMobileMenu } from './AppShell'
import type { Notification } from '@/types'

export function TopBar({ title }: { title?: string }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState<Notification[]>([])
  const { openMenu } = useMobileMenu()

  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications(user.uid, setUnread)
    return unsub
  }, [user])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        {/* モバイルでだけハンバーガー表示 */}
        <button
          onClick={openMenu}
          aria-label="メニュー"
          className="md:hidden -ml-1 rounded p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-white truncate">{title ?? ''}</h1>
      </div>
      <Link href="/notifications" className="relative shrink-0 p-2 text-slate-400 hover:text-white">
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </Link>
    </header>
  )
}
