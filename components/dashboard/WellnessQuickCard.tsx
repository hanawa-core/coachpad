'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronRight } from 'lucide-react'
import { getWellnessEntry, getRecentWellnessEntries } from '@/lib/firebase/firestore'
import type { WellnessEntry } from '@/types'

interface Props {
  athleteId: string
}

export function WellnessQuickCard({ athleteId }: Props) {
  const [today, setToday] = useState<WellnessEntry | null>(null)
  const [recent, setRecent] = useState<WellnessEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    Promise.all([
      getWellnessEntry(athleteId, todayStr),
      getRecentWellnessEntries(athleteId, 7),
    ]).then(([t, r]) => {
      setToday(t)
      setRecent(r)
    }).catch(() => {
      // Firestoreエラー時もスケルトンを解除
    }).finally(() => {
      setLoading(false)
    })
  }, [athleteId])

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-slate-800" />
  }

  // 直近7日の平均
  const validEntries = recent.filter((e) => e.fatigue != null)
  const avgFatigue =
    validEntries.length > 0
      ? validEntries.reduce((sum, e) => sum + (e.fatigue ?? 0), 0) / validEntries.length
      : null
  const avgSleep =
    recent.filter((e) => e.sleepQuality != null).length > 0
      ? recent
          .filter((e) => e.sleepQuality != null)
          .reduce((sum, e) => sum + (e.sleepQuality ?? 0), 0) /
        recent.filter((e) => e.sleepQuality != null).length
      : null

  return (
    <Link
      href="/wellness"
      className="block rounded-xl border border-pink-700/50 bg-pink-950/10 p-5 hover:bg-pink-950/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Heart className="h-5 w-5 text-pink-400" />
          Wellness
        </h2>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </div>

      {!today ? (
        <div className="rounded-lg bg-amber-500/10 border border-amber-700 px-3 py-2 text-sm text-amber-300">
          📝 本日の体調をまだ記録していません
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="疲労" value={today.fatigue} bad />
          <Stat label="睡眠" value={today.sleepQuality} bad={false} />
          <Stat label="気分" value={today.mood} bad={false} />
        </div>
      )}

      {avgFatigue != null && (
        <p className="mt-3 text-xs text-slate-400">
          直近7日平均: 疲労 {avgFatigue.toFixed(1)}
          {avgSleep != null && ` / 睡眠 ${avgSleep.toFixed(1)}`}
        </p>
      )}
    </Link>
  )
}

function Stat({ label, value, bad }: { label: string; value: number | null; bad: boolean }) {
  if (value == null)
    return (
      <div className="rounded-lg bg-slate-950 p-2">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-600">-</p>
      </div>
    )
  const intensity = bad ? value : 6 - value
  const color =
    intensity <= 2
      ? 'text-emerald-400'
      : intensity === 3
        ? 'text-yellow-400'
        : 'text-red-400'
  return (
    <div className="rounded-lg bg-slate-950 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
