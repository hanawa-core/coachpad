'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { TrendingUp, Activity, Battery } from 'lucide-react'
import type { Workout } from '@/types'

interface Props {
  athleteId: string
}

interface Metrics {
  ctl: number
  atl: number
  tsb: number
  weeklyDistance: number
  weeklyDuration: number
  count: number
}

export function TrainingLoadCard({ athleteId }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // 過去42日のワークアウトを取得
      const q = query(
        collection(db, 'workouts'),
        where('athleteId', '==', athleteId)
      )
      const snap = await getDocs(q)
      const workouts: Workout[] = snap.docs
        .map((d) => ({ ...(d.data() as Workout), id: d.id }))
        .filter((w) => w.completed)

      const today = new Date()
      const isoToday = today.toISOString().split('T')[0]

      // 直近のCTL/ATL/TSBを優先表示
      const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
      const latestWithMetrics = sorted.find(
        (w) => w.completed?.ctl != null || w.completed?.atl != null
      )

      let ctl = latestWithMetrics?.completed?.ctl ?? null
      let atl = latestWithMetrics?.completed?.atl ?? null

      // データがなければTSSから自前計算（簡易版）
      if (ctl == null || atl == null) {
        const calc = computeCTLATL(workouts, today)
        if (ctl == null) ctl = calc.ctl
        if (atl == null) atl = calc.atl
      }

      const tsb = (ctl ?? 0) - (atl ?? 0)

      // 今週の集計（月曜起点）
      const weekStart = getWeekStart(today)
      const weekWorkouts = workouts.filter((w) => w.date >= weekStart && w.date <= isoToday)
      const weeklyDistance = weekWorkouts.reduce(
        (sum, w) => sum + (w.completed?.distanceKm ?? 0),
        0
      )
      const weeklyDuration = weekWorkouts.reduce(
        (sum, w) => sum + (w.completed?.durationMin ?? 0),
        0
      )

      setMetrics({
        ctl: ctl ?? 0,
        atl: atl ?? 0,
        tsb,
        weeklyDistance,
        weeklyDuration,
        count: weekWorkouts.length,
      })
      setLoading(false)
    }
    load()
  }, [athleteId])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-4">
      {/* CTL/ATL/TSB */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          トレーニング負荷
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Metric
            icon={TrendingUp}
            color="emerald"
            label="CTL"
            sublabel="フィットネス"
            value={metrics.ctl.toFixed(0)}
          />
          <Metric
            icon={Activity}
            color="amber"
            label="ATL"
            sublabel="疲労"
            value={metrics.atl.toFixed(0)}
          />
          <Metric
            icon={Battery}
            color={metrics.tsb >= 0 ? 'blue' : 'red'}
            label="TSB"
            sublabel="フォーム"
            value={metrics.tsb >= 0 ? `+${metrics.tsb.toFixed(0)}` : metrics.tsb.toFixed(0)}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {tsbHint(metrics.tsb)}
        </p>
      </div>

      {/* 今週の集計 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          今週のサマリー
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">距離</p>
            <p className="mt-1 text-xl font-bold text-white">
              {metrics.weeklyDistance.toFixed(1)}<span className="text-sm text-slate-400 ml-0.5">km</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">時間</p>
            <p className="mt-1 text-xl font-bold text-white">
              {Math.floor(metrics.weeklyDuration / 60)}:{String(metrics.weeklyDuration % 60).padStart(2, '0')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">回数</p>
            <p className="mt-1 text-xl font-bold text-white">
              {metrics.count}<span className="text-sm text-slate-400 ml-0.5">回</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  color,
  label,
  sublabel,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  color: 'emerald' | 'amber' | 'blue' | 'red'
  label: string
  sublabel: string
  value: string
}) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10',
  }
  return (
    <div className="rounded-lg bg-slate-950 p-3 text-center">
      <span className={`inline-flex rounded-lg p-1.5 ${colorMap[color]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-medium text-slate-300">{label}</p>
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
  )
}

function tsbHint(tsb: number): string {
  if (tsb > 25) return '⚠️ 休みすぎの可能性。トレーニング再開を'
  if (tsb >= 5) return '✅ 良好なフォーム。ピーキングOK'
  if (tsb >= -10) return '🏃 通常のトレーニング状態'
  if (tsb >= -30) return '💪 強めの負荷。回復に注意'
  return '🚨 オーバートレーニング注意'
}

function getWeekStart(d: Date): string {
  const day = d.getDay() // 0=日
  const diff = day === 0 ? -6 : 1 - day // 月曜起点
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

/**
 * 簡易CTL/ATL計算
 * CTL = 過去42日のTSS指数移動平均
 * ATL = 過去7日のTSS指数移動平均
 * TSSがない場合は durationMin × intensity係数で代用
 */
function computeCTLATL(workouts: Workout[], today: Date): { ctl: number; atl: number } {
  const dayMs = 24 * 60 * 60 * 1000
  const tssByDate = new Map<string, number>()

  workouts.forEach((w) => {
    if (!w.completed) return
    let tss = w.completed.tss
    // TSSなしの場合: 距離+時間から推定
    if (tss == null) {
      const dur = w.completed.durationMin ?? 0
      const dist = w.completed.distanceKm ?? 0
      // ざっくり: 1時間のEasy run ≈ 50 TSS、ペースで補正
      tss = dur * 0.85 + dist * 1.5
    }
    tssByDate.set(w.date, (tssByDate.get(w.date) ?? 0) + tss)
  })

  // 直近42日
  let ctl = 0
  let atl = 0
  const ctlAlpha = 1 - Math.exp(-1 / 42)
  const atlAlpha = 1 - Math.exp(-1 / 7)

  for (let i = 41; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs)
    const dateStr = d.toISOString().split('T')[0]
    const tss = tssByDate.get(dateStr) ?? 0
    ctl = ctl + ctlAlpha * (tss - ctl)
    atl = atl + atlAlpha * (tss - atl)
  }

  return { ctl, atl }
}
