'use client'

import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import { getWorkoutsByMonth, getStrengthAssignmentsByMonth } from '@/lib/firebase/firestore'

interface Props {
  athleteId: string
  /** コーチ閲覧時に渡す（Firestoreルール対策） */
  coachId?: string
  /** 集計対象の日数 */
  days?: number
}

interface Rate {
  done: number
  total: number
}

function pct(r: Rate): number {
  return r.total === 0 ? 0 : Math.round((r.done / r.total) * 100)
}

export function AdherenceCard({ athleteId, coachId, days = 30 }: Props) {
  const [run, setRun] = useState<Rate>({ done: 0, total: 0 })
  const [strength, setStrength] = useState<Rate>({ done: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth() + 1
      const prevY = m === 1 ? y - 1 : y
      const prevM = m === 1 ? 12 : m - 1
      const since = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)

      const [w1, w2, s1, s2] = await Promise.all([
        getWorkoutsByMonth(athleteId, y, m, coachId),
        getWorkoutsByMonth(athleteId, prevY, prevM, coachId),
        getStrengthAssignmentsByMonth(athleteId, y, m, coachId),
        getStrengthAssignmentsByMonth(athleteId, prevY, prevM, coachId),
      ])

      // ランニング：計画があるワークアウト（planned）のうち、実施済（completed）の割合
      const workouts = [...w1, ...w2].filter((w) => w.date >= since && w.planned)
      const runTotal = workouts.length
      const runDone = workouts.filter((w) => w.completed).length

      // 筋トレ：割り当てのうち status='completed' の割合
      const assigns = [...s1, ...s2].filter((s) => s.date >= since)
      const strTotal = assigns.length
      const strDone = assigns.filter((s) => s.status === 'completed').length

      setRun({ done: runDone, total: runTotal })
      setStrength({ done: strDone, total: strTotal })
      setLoading(false)
    }
    load()
  }, [athleteId, coachId, days])

  const combined: Rate = {
    done: run.done + strength.done,
    total: run.total + strength.total,
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        <Target className="h-5 w-5 text-emerald-400" />
        実施率（直近{days}日）
      </h2>

      {loading ? (
        <div className="h-24 animate-pulse rounded bg-slate-800" />
      ) : combined.total === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          この期間に計画された練習・筋トレがありません
        </p>
      ) : (
        <div className="space-y-3">
          <Bar label="ランニング" rate={run} />
          <Bar label="筋トレ" rate={strength} />
          <Bar label="合計" rate={combined} highlight />
        </div>
      )}
    </div>
  )
}

function Bar({ label, rate, highlight }: { label: string; rate: Rate; highlight?: boolean }) {
  const p = pct(rate)
  const color = p >= 90 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={highlight ? 'font-semibold text-white' : 'text-slate-300'}>{label}</span>
        <span className="text-slate-400">
          {rate.total === 0 ? '—' : `${rate.done}/${rate.total}・`}
          <span className={`font-bold ${highlight ? 'text-white' : 'text-slate-200'}`}>{p}%</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}
