'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { ChatThread } from '@/components/chat/ChatThread'
import {
  subscribeChatThreads,
  computeUnreadCount,
} from '@/lib/firebase/firestore'
import type { ChatThread as ChatThreadType } from '@/types'

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [threads, setThreads] = useState<ChatThreadType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeChatThreads(user.uid, (data) => {
      setThreads(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  if (!user || !profile) return null

  // 選手は1対1なので直接スレッドを開く
  if (profile.role === 'athlete') {
    if (!profile.coachId) {
      return (
        <>
          <TopBar title="チャット" />
          <div className="p-4 sm:p-6">
            <p className="text-sm text-slate-400">コーチが設定されていません</p>
          </div>
        </>
      )
    }
    return (
      <>
        <TopBar title="チャット" />
        <div className="p-4 sm:p-6">
          <ChatThread
            coachId={profile.coachId}
            athleteId={user.uid}
            otherName="コーチ"
            selfName={profile.displayName ?? '選手'}
            selfRole="athlete"
          />
        </div>
      </>
    )
  }

  // コーチ：スレッド一覧
  return (
    <>
      <TopBar title="チャット" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">
              まだチャットがありません。選手詳細から開始できます
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => {
              const unread = computeUnreadCount(t, user.uid)
              const lastMsg = t.lastMessage
              return (
                <li key={t.id}>
                  <Link
                    href={`/chat/${t.athleteId}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:bg-slate-900/70"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                      {t.athleteName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">
                          {t.athleteName}
                        </p>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {formatRelativeTime(lastMsg.sentAt)}
                          </span>
                        )}
                      </div>
                      {lastMsg ? (
                        <p
                          className={`mt-0.5 text-xs truncate ${
                            unread > 0 ? 'text-white font-medium' : 'text-slate-400'
                          }`}
                        >
                          {lastMsg.senderId === user.uid && '自分: '}
                          {lastMsg.text}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-500">メッセージはまだありません</p>
                      )}
                    </div>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

function formatRelativeTime(ts: any): string {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diffMin = Math.floor((Date.now() - d.getTime()) / (1000 * 60))
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}時間前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}日前`
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}
