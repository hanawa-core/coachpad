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
  ReferenceLine,
} from 'recharts'
import { getRecentWellnessEntries } from '@/lib/firebase/firestore'
import type { WellnessEntry } from '@/types'

interface Props {
  athleteId: string
  days?: number
}

export function WellnessChart({ athleteId, days = 30 }: Props) {
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentWellnessEntries(athleteId, days).then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [athleteId, days])

  if (loading) {
    return <div className="h-48 animate-pulse rounded bg-slate-800" />
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Wellness データがまだ記録されていません
      </p>
    )
  }

  const data = entries.map((e) => ({
    date: e.date.slice(5), // MM-DD
    睡眠: e.sleepQuality,
    疲労: e.fatigue,
    筋肉痛: e.soreness,
    気分: e.mood,
    ストレス: e.stress,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#475569"
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
          <ReferenceLine y={3} stroke="#475569" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="睡眠" stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="疲労" stroke="#fbbf24" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="筋肉痛" stroke="#f87171" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="気分" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ストレス" stroke="#a78bfa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
