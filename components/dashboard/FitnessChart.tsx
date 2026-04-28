'use client'

import { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { Workout } from '@/types'

interface Props {
  athleteId: string
  /** 表示日数。30/90/180/365 */
  defaultDays?: number
}

interface DataPoint {
  date: string
  dateLabel: string
  ctl: number // フィットネス
  atl: number // 疲労
  tsb: number // フォーム
  tss: number // 当日のTSS（バー表示用）
}

const PRESETS = [
  { days: 7, label: '7日' },
  { days: 10, label: '10日' },
  { days: 30, label: '30日' },
  { days: 90, label: '90日' },
  { days: 180, label: '半年' },
  { days: 365, label: '1年' },
]

export function FitnessChart({ athleteId, defaultDays = 7 }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [days, setDays] = useState(defaultDays)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const q = query(collection(db, 'workouts'), where('athleteId', '==', athleteId))
      const snap = await getDocs(q)
      if (cancelled) return
      const data = snap.docs.map((d) => ({ ...(d.data() as Workout), id: d.id }))
      setWorkouts(data)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [athleteId])

  const chartData = useMemo(() => buildTimeSeries(workouts, days), [workouts, days])

  // TSBの色ゾーン用にYRange計算
  const tsbStats = useMemo(() => {
    if (chartData.length === 0) return { min: -30, max: 30 }
    const tsbs = chartData.map((d) => d.tsb)
    return {
      min: Math.min(-30, Math.floor(Math.min(...tsbs) - 5)),
      max: Math.max(30, Math.ceil(Math.max(...tsbs) + 5)),
    }
  }, [chartData])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 h-64 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  const latest = chartData[chartData.length - 1]

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-white">
          フィットネス・疲労チャート
        </h2>
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                days === p.days
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 現在値 */}
      {latest && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <ValueBox
            label="フィットネス (CTL)"
            value={latest.ctl.toFixed(0)}
            color="text-cyan-400"
            sublabel="42日平均"
          />
          <ValueBox
            label="疲労 (ATL)"
            value={latest.atl.toFixed(0)}
            color="text-purple-400"
            sublabel="7日平均"
          />
          <ValueBox
            label="フォーム (TSB)"
            value={latest.tsb >= 0 ? `+${latest.tsb.toFixed(0)}` : latest.tsb.toFixed(0)}
            color={tsbColor(latest.tsb)}
            sublabel={tsbZoneName(latest.tsb)}
          />
        </div>
      )}

      {chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          まだデータがありません。ワークアウトを記録するか Strava を同期してください
        </p>
      ) : (
        <>
          {/* メインチャート: CTL/ATL */}
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  stroke="#475569"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any, name: any) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    String(name ?? ''),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {/* TSS バー (背景) */}
                <Area
                  type="step"
                  dataKey="tss"
                  name="TSS"
                  fill="#475569"
                  stroke="none"
                  fillOpacity={0.3}
                  yAxisId="left"
                />
                {/* CTL（フィットネス、青） */}
                <Line
                  type="monotone"
                  dataKey="ctl"
                  name="フィットネス"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={false}
                  yAxisId="left"
                />
                {/* ATL（疲労、紫） */}
                <Line
                  type="monotone"
                  dataKey="atl"
                  name="疲労"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  yAxisId="left"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* TSB チャート */}
          <div className="mt-4 h-44 w-full">
            <p className="mb-1 text-xs font-medium text-slate-400">フォーム (TSB)</p>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  stroke="#475569"
                />
                <YAxis
                  domain={[tsbStats.min, tsbStats.max]}
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
                  formatter={(value: any) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    'TSB',
                  ]}
                />
                {/* ゾーン背景 */}
                <ReferenceArea y1={25} y2={tsbStats.max} fill="#fbbf24" fillOpacity={0.1} />
                <ReferenceArea y1={5} y2={25} fill="#22d3ee" fillOpacity={0.1} />
                <ReferenceArea y1={-10} y2={5} fill="#94a3b8" fillOpacity={0.08} />
                <ReferenceArea y1={-30} y2={-10} fill="#34d399" fillOpacity={0.1} />
                <ReferenceArea y1={tsbStats.min} y2={-30} fill="#ef4444" fillOpacity={0.1} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="tsb"
                  name="TSB"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ゾーン凡例 */}
          <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] md:grid-cols-5">
            <Zone color="bg-amber-400/20" label="トランジション (>25)" />
            <Zone color="bg-cyan-400/20" label="フレッシュ (5〜25)" />
            <Zone color="bg-slate-400/15" label="グレーゾーン (-10〜5)" />
            <Zone color="bg-emerald-400/20" label="最適 (-30〜-10)" />
            <Zone color="bg-red-500/20" label="高リスク (<-30)" />
          </div>

          {/* 説明 */}
          <div className="mt-3 rounded-lg bg-slate-950 px-4 py-3 text-xs text-slate-400 leading-relaxed">
            <p>
              <span className="text-cyan-400 font-medium">青いライン</span>はフィットネス（過去42日のトレーニング負荷の指数加重移動平均）。
              <span className="text-purple-400 font-medium">紫のライン</span>は疲労（過去7日）。
              フィットネスを高めるには紫が青の上にある状態を作る必要があります。
              <span className="text-red-400 font-medium">高リスクゾーン</span>に長く留まるとオーバートレーニング。
              レース前は<span className="text-cyan-400 font-medium">フレッシュゾーン</span>で迎えるのが理想です。
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function ValueBox({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string
  color: string
  sublabel: string
}) {
  return (
    <div className="rounded-lg bg-slate-950 px-3 py-2.5 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-600">{sublabel}</p>
    </div>
  )
}

function Zone({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      <span className="text-slate-400">{label}</span>
    </div>
  )
}

function tsbColor(tsb: number): string {
  if (tsb > 25) return 'text-amber-400'
  if (tsb >= 5) return 'text-cyan-400'
  if (tsb >= -10) return 'text-slate-300'
  if (tsb >= -30) return 'text-emerald-400'
  return 'text-red-400'
}

function tsbZoneName(tsb: number): string {
  if (tsb > 25) return 'トランジション'
  if (tsb >= 5) return 'フレッシュ'
  if (tsb >= -10) return 'グレーゾーン'
  if (tsb >= -30) return '最適'
  return '高リスク'
}

/**
 * 時系列データの構築
 */
function buildTimeSeries(workouts: Workout[], days: number): DataPoint[] {
  const dayMs = 24 * 60 * 60 * 1000
  const today = new Date()

  // 日別TSSマップ
  const tssByDate = new Map<string, number>()
  workouts.forEach((w) => {
    if (!w.completed) return
    let tss = w.completed.tss
    if (tss == null) {
      const dur = w.completed.durationMin ?? 0
      const dist = w.completed.distanceKm ?? 0
      tss = dur * 0.85 + dist * 1.5
    }
    tssByDate.set(w.date, (tssByDate.get(w.date) ?? 0) + tss)
  })

  // 開始日（日数+42日 前から計算してウォームアップ）
  const warmup = 42
  const totalDays = days + warmup
  const startDate = new Date(today.getTime() - (totalDays - 1) * dayMs)

  const ctlAlpha = 1 - Math.exp(-1 / 42)
  const atlAlpha = 1 - Math.exp(-1 / 7)
  let ctl = 0
  let atl = 0

  const data: DataPoint[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate.getTime() + i * dayMs)
    const dateStr = d.toISOString().split('T')[0]
    const tss = tssByDate.get(dateStr) ?? 0
    ctl = ctl + ctlAlpha * (tss - ctl)
    atl = atl + atlAlpha * (tss - atl)

    if (i >= warmup) {
      data.push({
        date: dateStr,
        dateLabel: formatDateLabel(d, days),
        ctl,
        atl,
        tsb: ctl - atl,
        tss,
      })
    }
  }

  return data
}

function formatDateLabel(d: Date, totalDays: number): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (totalDays >= 180) {
    return `${m}月`
  }
  return `${m}/${day}`
}
