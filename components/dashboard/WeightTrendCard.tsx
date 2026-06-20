'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Scale } from 'lucide-react'
import { getRecentWellnessEntries, getWorkoutsByMonth } from '@/lib/firebase/firestore'

interface Props {
  athleteId: string
  /** コーチ閲覧時に渡す（Firestoreルール対策） */
  coachId?: string
}

interface Point {
  date: string
  weight: number | null
  bodyFat: number | null
}

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null
}

export function WeightTrendCard({ athleteId, coachId }: Props) {
  const [data, setData] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth() + 1
      const prevY = m === 1 ? y - 1 : y
      const prevM = m === 1 ? 12 : m - 1

      const [wellness, curWorkouts, prevWorkouts] = await Promise.all([
        getRecentWellnessEntries(athleteId, 60),
        getWorkoutsByMonth(athleteId, y, m, coachId),
        getWorkoutsByMonth(athleteId, prevY, prevM, coachId),
      ])

      // date -> { weight, bodyFat }（ワークアウト指標を優先、なければ wellness 体重）
      const byDate = new Map<string, Point>()
      const ensure = (date: string) => {
        let p = byDate.get(date)
        if (!p) {
          p = { date, weight: null, bodyFat: null }
          byDate.set(date, p)
        }
        return p
      }

      for (const e of wellness) {
        const w = num(e.weight)
        if (w != null) ensure(e.date).weight = w
      }
      for (const wk of [...prevWorkouts, ...curWorkouts]) {
        const metrics = wk.completed?.metrics
        if (!metrics) continue
        const w = num(metrics.weightKg)
        const bf = num(metrics.bodyFatPct)
        if (w != null) ensure(wk.date).weight = w
        if (bf != null) ensure(wk.date).bodyFat = bf
      }

      const points = Array.from(byDate.values())
        .filter((p) => p.weight != null || p.bodyFat != null)
        .sort((a, b) => a.date.localeCompare(b.date))

      setData(points)
      setLoading(false)
    }
    load()
  }, [athleteId, coachId])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        <Scale className="h-4 w-4 text-emerald-400" />
        体重・体脂肪の推移
      </h2>

      {loading ? (
        <div className="h-48 animate-pulse rounded bg-slate-800" />
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          体重・体脂肪のデータがまだ記録されていません
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart
              data={data.map((p) => ({ date: p.date.slice(5), 体重: p.weight, 体脂肪率: p.bodyFat }))}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="#475569"
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="#475569"
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="体重"
                stroke="#34d399"
                strokeWidth={2}
                connectNulls
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="体脂肪率"
                stroke="#fbbf24"
                strokeWidth={2}
                connectNulls
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> 体重(kg)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> 体脂肪率(%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
