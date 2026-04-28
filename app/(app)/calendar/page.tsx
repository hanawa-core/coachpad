'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const { user, profile, loading } = useAuth()

  if (loading || !user || !profile) {
    return (
      <>
        <TopBar title="カレンダー" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  // コーチが自分のカレンダーを開いた場合は選手一覧にリダイレクト的な扱い
  if (profile.role === 'coach') {
    return (
      <>
        <TopBar title="カレンダー" />
        <div className="p-6">
          <p className="text-sm text-slate-400 mb-4">
            選手を選んでカレンダーを表示してください
          </p>
          <Link
            href="/athletes"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            選手一覧へ
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="カレンダー" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link
            href="/workouts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            ワークアウト記録
          </Link>
        </div>
        <CalendarMonthView athleteId={user.uid} />
      </div>
    </>
  )
}
