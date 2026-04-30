'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Library,
  Users,
  Bell,
  Settings,
  LogOut,
  Video,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { subscribeChatThreads, computeUnreadCount } from '@/lib/firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { logOut } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

const coachNav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/athletes', label: '選手一覧', icon: Users },
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/strength/templates', label: 'プロトコル', icon: Dumbbell },
  { href: '/strength/exercises', label: '種目ライブラリ', icon: Library },
  { href: '/motion', label: '動作分析', icon: Video },
  { href: '/chat', label: 'チャット', icon: MessageCircle, badge: 'chat' as const },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/settings', label: '設定', icon: Settings },
]

const athleteNav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/wellness', label: 'Wellness', icon: Heart },
  { href: '/motion', label: '動作分析', icon: Video },
  { href: '/chat', label: 'チャット', icon: MessageCircle, badge: 'chat' as const },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/settings', label: '設定', icon: Settings },
]

function EcgLogo() {
  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-950 shrink-0">
      <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
        {/* グリッド */}
        <line x1="12" y1="30" x2="88" y2="30" stroke="#1E293B" strokeWidth="3" />
        <line x1="12" y1="45" x2="88" y2="45" stroke="#1E293B" strokeWidth="3" />
        <line x1="12" y1="60" x2="88" y2="60" stroke="#1E293B" strokeWidth="3" />
        <line x1="12" y1="75" x2="88" y2="75" stroke="#1E293B" strokeWidth="3" />
        <line x1="12" y1="25" x2="12" y2="80" stroke="#1E293B" strokeWidth="3" />
        <line x1="30" y1="25" x2="30" y2="80" stroke="#1E293B" strokeWidth="3" />
        <line x1="48" y1="25" x2="48" y2="80" stroke="#1E293B" strokeWidth="3" />
        <line x1="66" y1="25" x2="66" y2="80" stroke="#1E293B" strokeWidth="3" />
        <line x1="84" y1="25" x2="84" y2="80" stroke="#1E293B" strokeWidth="3" />
        {/* ECG ライン */}
        <polyline
          points="12,52 22,52 25,52 27,30 29,52 31,68 35,52 44,52 54,52 58,52 62,26 64,52 66,62 70,52 80,52 88,52"
          stroke="#10B981"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* ピーク */}
        <circle cx="62" cy="26" r="7" fill="#FBBF24" />
        {/* 右端ドット */}
        <circle cx="88" cy="52" r="5" fill="#10B981" />
      </svg>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeChatThreads(user.uid, (threads) => {
      const total = threads.reduce((sum, t) => sum + computeUnreadCount(t, user.uid), 0)
      setChatUnread(total)
    })
    return unsub
  }, [user])

  const nav = profile?.role === 'coach' ? coachNav : athleteNav

  const handleLogout = async () => {
    await logOut()
    router.replace('/login')
  }

  const handleNavClick = () => {
    onNavigate?.()
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-slate-900 border-r border-slate-800">
      {/* ロゴ */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
        <EcgLogo />
        <span className="text-lg font-bold text-white">CoachPad</span>
      </div>

      {/* ロール表示 */}
      <div className="px-6 py-3 border-b border-slate-800">
        <span className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          profile?.role === 'coach'
            ? 'bg-emerald-900 text-emerald-300'
            : 'bg-blue-900 text-blue-300'
        )}>
          {profile?.role === 'coach' ? 'コーチ' : '選手'}
        </span>
        <p className="mt-1 text-sm font-medium text-white truncate">{profile?.displayName}</p>
      </div>

      {/* ナビ */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => {
          const { href, label, icon: Icon } = item
          const badge = (item as any).badge
          const active = pathname === href || pathname.startsWith(href + '/')
          const showChatBadge = badge === 'chat' && chatUnread > 0
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative',
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {showChatBadge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {chatUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ログアウト */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
