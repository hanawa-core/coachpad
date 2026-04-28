'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { ChatThread } from '@/components/chat/ChatThread'
import { getAthleteCache } from '@/lib/firebase/firestore'
import type { AthleteCache } from '@/types'

export default function ChatWithAthletePage() {
  const params = useParams()
  const athleteId = params.athleteId as string
  const { user, profile } = useAuth()
  const [athlete, setAthlete] = useState<AthleteCache | null>(null)

  useEffect(() => {
    getAthleteCache(athleteId).then(setAthlete)
  }, [athleteId])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="チャット" />
        <div className="p-6">
          <p className="text-sm text-slate-400">権限がありません</p>
        </div>
      </>
    )
  }

  if (!user || !athlete) {
    return (
      <>
        <TopBar title="チャット" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title={`${athlete.displayName} とのチャット`} />
      <div className="p-6 space-y-3">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>
        <ChatThread
          coachId={user.uid}
          athleteId={athleteId}
          otherName={athlete.displayName}
          selfName={profile.displayName ?? 'コーチ'}
          selfRole="coach"
        />
      </div>
    </>
  )
}
