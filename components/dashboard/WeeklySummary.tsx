'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { TrendingUp, Calendar, Activity, Clock, Mountain } from 'lucide-react'
import type { Workout } from '@/types'

interface Props {
  athleteId: string
}

interface WeekStats {
  workouts: number
  distance: number
  duration: number
  elevation: number
  tss: number
}

export function WeeklySummary({ athleteId }: Props) {
  const [stats, setStats] = useState<{ thisWeek: WeekStats; lastWeek: WeekStats } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'workouts'), where('athleteId', '==', athleteId))
      const snap = await getDocs(q)
      const workouts = snap.docs
        .map((d) => ({ ...(d.data() as Workout), id: d.id }))
        .filter((w) => w.completed)

      const thisWeek = computeWeekStats(workouts, 0)
      const lastWeek = computeWeekStats(workouts, 1)
      setStats({ thisWeek, lastWeek })
      setLoading(false)
    }
    load()
  }, [athleteId])

  if (loading || !stats) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        週間サマリー
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat
          icon={Calendar}
          label="セッション"
          value={`${stats.thisWeek.workouts}`}
          unit="回"
          delta={stats.thisWeek.workouts - stats.lastWeek.workouts}
        />
        <Stat
          icon={Activity}
          label="距離"
          value={stats.thisWeek.distance.toFixed(1)}
          unit="km"
          delta={Number((stats.thisWeek.distance - stats.lastWeek.distance).toFixed(1))}
        />
        <Stat
          icon={Clock}
          label="時間"
          value={`${Math.floor(stats.thisWeek.duration / 60)}:${String(Math.round(stats.thisWeek.duration % 60)).padStart(2, '0')}`}
          unit=""
          delta={Math.round(stats.thisWeek.duration - stats.lastWeek.duration)}
          deltaUnit="分"
        />
        <Stat
          icon={Mountain}
          label="獲得標高"
          value={`${Math.round(stats.thisWeek.elevation)}`}
          unit="m"
          delta={Math.round(stats.thisWeek.elevation - stats.lastWeek.elevation)}
        />
        <Stat
          icon={TrendingUp}
          label="TSS"
          value={`${Math.round(stats.thisWeek.tss)}`}
          unit=""
          delta={Math.round(stats.thisWeek.tss - stats.lastWeek.tss)}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">前週比 (デルタ)</p>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaUnit,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  unit: string
  delta: number
  deltaUnit?: string
}) {
  const positive = delta > 0
  const neutral = delta === 0
  return (
    <div className="rounded-lg bg-slate-950 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">
        {value}
        {unit && <span className="text-xs text-slate-400 ml-0.5">{unit}</span>}
      </p>
      {!neutral && (
        <p
          className={`mt-0.5 text-[10px] ${positive ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {positive ? '+' : ''}
          {delta}
          {deltaUnit ?? unit}
        </p>
      )}
    </div>
  )
}

function computeWeekStats(workouts: Workout[], weekOffset: number): WeekStats {
  const today = new Date()
  // 月曜起点
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() + diffToMonday)
  thisMonday.setHours(0, 0, 0, 0)

  const targetMonday = new Date(thisMonday)
  targetMonday.setDate(thisMonday.getDate() - weekOffset * 7)
  const targetSunday = new Date(targetMonday)
  targetSunday.setDate(targetMonday.getDate() + 6)

  const startStr = targetMonday.toISOString().split('T')[0]
  const endStr = targetSunday.toISOString().split('T')[0]

  const inRange = workouts.filter((w) => w.date >= startStr && w.date <= endStr)

  let distance = 0
  let duration = 0
  let elevation = 0
  let tss = 0
  inRange.forEach((w) => {
    if (!w.completed) return
    distance += w.completed.distanceKm ?? 0
    duration += w.completed.durationMin ?? 0
    elevation += w.completed.elevationGainM ?? 0
    tss += w.completed.tss ?? (w.completed.durationMin ?? 0) * 0.85 + (w.completed.distanceKm ?? 0) * 1.5
  })

  return {
    workouts: inRange.length,
    distance,
    duration,
    elevation,
    tss,
  }
}
