'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface Point {
  value: number
  recordedAt: string
}

interface Props {
  history: Point[]
  unit: string
  /** 値が小さいほど良いテスト（タイム等） */
  betterWhenLower?: boolean
}

export function TestTrendChart({ history, unit, betterWhenLower }: Props) {
  if (!history || history.length < 2) return null

  const sorted = [...history].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const data = sorted.map((p) => ({ date: p.recordedAt.slice(5), 値: p.value }))

  const first = sorted[0].value
  const last = sorted[sorted.length - 1].value
  const diff = last - first
  const improved = betterWhenLower ? diff < 0 : diff > 0
  const changed = diff !== 0
  const color = !changed ? '#94a3b8' : improved ? '#34d399' : '#f87171'

  return (
    <div className="mt-2">
      <div className="h-28 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#475569" />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#475569" domain={['dataMin', 'dataMax']} width={32} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: any) => [`${v} ${unit}`, '記録']}
            />
            <Line type="monotone" dataKey="値" stroke={color} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {changed && (
        <p className={`mt-1 text-[11px] ${improved ? 'text-emerald-400' : 'text-red-400'}`}>
          初回比 {diff > 0 ? '+' : ''}{Number(diff.toFixed(1))} {unit}
          {improved ? '（改善）' : '（低下）'}
        </p>
      )}
    </div>
  )
}
