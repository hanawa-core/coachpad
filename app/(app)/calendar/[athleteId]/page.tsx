'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { PlanWorkoutForm } from '@/components/workouts/PlanWorkoutForm'
import { WeekCopyModal } from '@/components/calendar/WeekCopyModal'
import { getAthleteCache } from '@/lib/firebase/firestore'
import type { AthleteCache } from '@/types'

export default function AthleteCalendarPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const athleteId = params.athleteId as string
  const action = searchParams.get('action')
  const date = searchParams.get('date')

  const { profile, user } = useAuth()
  const [athlete, setAthlete] = useState<AthleteCache | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getAthleteCache(athleteId).then(setAthlete)
  }, [athleteId])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="カレンダー" />
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-400">権限がありません</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title={athlete ? `${athlete.displayName} のカレンダー` : 'カレンダー'} />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/athletes"
            className="text-sm text-slate-400 hover:text-white whitespace-nowrap shrink-0"
          >
            ← 選手一覧
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCopyOpen(true)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 whitespace-nowrap"
            >
              週コピー
            </button>
            <Link
              href={`/calendar/${athleteId}/ai-plan`}
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 whitespace-nowrap"
            >
              <span className="sm:hidden">AIプラン</span>
              <span className="hidden sm:inline">AIで週間プラン作成</span>
            </Link>
          </div>
        </div>

        {user && (
          <WeekCopyModal
            athleteId={athleteId}
            coachId={user.uid}
            isOpen={copyOpen}
            onClose={() => setCopyOpen(false)}
            onDone={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {action === 'plan' && date && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-6">
            <h3 className="mb-3 text-base font-semibold text-white">
              {date} のメニュー作成
            </h3>
            <PlanWorkoutForm
              athleteId={athleteId}
              coachId={profile.uid}
              date={date}
              onDone={() => {
                window.location.href = `/calendar/${athleteId}`
              }}
            />
          </div>
        )}

        <CalendarMonthView athleteId={athleteId} isCoachView refreshKey={refreshKey} />
      </div>
    </>
  )
}
