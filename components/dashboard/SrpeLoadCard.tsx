'use client'

/**
 * sRPE 負荷ダッシュボード（loadModel = 'srpe' の選手向け）。
 * 日別負荷の棒グラフ ＋ 急性/慢性 EWMA の折れ線 ＋ ACWR ゲージ。
 *
 * 既存の FitnessChart（CTL/ATL/TSB）と同じく、生のワークアウトから
 * クライアント側で都度算出する（サーバ側に新コレクションを作らない）。
 * Strava/CTL の算出パスには一切触れない。
 */

import { useEffect, useMemo, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getRecentWellnessEntries } from '@/lib/firebase/firestore'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { Workout, WellnessEntry } from '@/types'
import {
  dailyLoadFor,
  computeSrpeSeries,
  ACWR_ZONE_META,
  type SrpeDay,
} from '@/lib/load/srpe'

// 取得するウェルネス履歴の窓（最大表示90日 + EWMAウォームアップ約56日）
const WELLNESS_FETCH_DAYS = 180

interface Props {
  athleteId: string
  /** 表示日数（既定 30） */
  defaultDays?: number
}

const RANGE_PRESETS = [
  { days: 14, label: '14日' },
  { days: 30, label: '30日' },
  { days: 90, label: '90日' },
]

export function SrpeLoadCard({ athleteId, defaultDays = 30 }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [wellness, setWellness] = useState<WellnessEntry[]>([])
  const [days, setDays] = useState(defaultDays)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const q = query(collection(db, 'workouts'), where('athleteId', '==', athleteId))
      const [snap, wellnessEntries] = await Promise.all([
        getDocs(q),
        getRecentWellnessEntries(athleteId, WELLNESS_FETCH_DAYS).catch(() => []),
      ])
      if (cancelled) return
      setWorkouts(snap.docs.map((d) => ({ ...(d.data() as Workout), id: d.id })))
      setWellness(wellnessEntries)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [athleteId])

  const series = useMemo(() => {
    // 毎日のウェルネス入力（RPE×時間）を優先し、ワークアウト記録で補完
    const daily = dailyLoadFor(workouts, wellness)
    return computeSrpeSeries(daily, { lookbackDays: days })
  }, [workouts, wellness, days])

  const chartData = useMemo(
    () =>
      series.map((d) => ({
        date: d.date,
        dateLabel: formatDateLabel(d.date, days),
        dailyLoad: Math.round(d.dailyLoad),
        acute: Number(d.acuteEWMA.toFixed(1)),
        chronic: Number(d.chronicEWMA.toFixed(1)),
      })),
    [series, days]
  )

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 h-64 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  const latest: SrpeDay | undefined = series[series.length - 1]
  const hasData = series.some((d) => d.dailyLoad > 0)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-white">負荷バランス（sRPE）</h2>
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                days === p.days ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="py-12 text-center text-sm text-slate-500">
          まだ負荷データがありません。ワークアウト記録時に RPE と時間を入力してください
        </p>
      ) : (
        <>
          {/* 現在値 + ACWR ゲージ */}
          {latest && <AcwrGauge day={latest} />}

          {/* 日別負荷バー + 急性/慢性 EWMA 折れ線 */}
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="dailyLoad" name="日別負荷" fill="#475569" fillOpacity={0.5} barSize={6} />
                <Line
                  type="monotone"
                  dataKey="chronic"
                  name="慢性負荷(28日)"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="acute"
                  name="急性負荷(7日)"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ゾーン凡例 */}
          <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] md:grid-cols-4">
            <Zone hex={ACWR_ZONE_META.low.hex} label="低負荷 (<0.8)" />
            <Zone hex={ACWR_ZONE_META.optimal.hex} label="適正 (0.8〜1.3)" />
            <Zone hex={ACWR_ZONE_META.high.hex} label="やや高い (1.3〜1.5)" />
            <Zone hex={ACWR_ZONE_META.risk.hex} label="高リスク (>1.5)" />
          </div>

          {/* 説明 */}
          <div className="mt-3 rounded-lg bg-slate-950 px-4 py-3 text-xs leading-relaxed text-slate-400">
            <p>
              <span className="font-medium text-purple-400">急性負荷</span>は直近7日、
              <span className="font-medium text-cyan-400">慢性負荷</span>は直近28日のセッション負荷（RPE×時間）の指数加重移動平均。
              その比 <span className="font-medium text-white">ACWR</span> が 0.8〜1.3 の適正帯にあると、
              故障リスクを抑えつつフィットネスを高められます。
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/** ACWR ゲージ + 急性/慢性/ACWR の現在値 */
function AcwrGauge({ day }: { day: SrpeDay }) {
  const meta = ACWR_ZONE_META[day.zone]
  // ゲージ位置: ACWR 0〜2 を 0〜100% にマップ
  const pct = day.acwr != null ? Math.min(100, Math.max(0, (day.acwr / 2) * 100)) : 0

  return (
    <div className={`rounded-lg p-4 ${meta.bg}`}>
      <div className="grid grid-cols-3 gap-2">
        <ValueBox label="急性負荷 (7日)" value={day.acuteEWMA.toFixed(0)} color="text-purple-400" />
        <ValueBox label="慢性負荷 (28日)" value={day.chronicEWMA.toFixed(0)} color="text-cyan-400" />
        <ValueBox
          label="ACWR（負荷バランス）"
          value={!day.established || day.acwr == null ? '—' : day.acwr.toFixed(2)}
          color={meta.color}
          sublabel={meta.label}
        />
      </div>

      {/* ゲージバー（0〜2 スケール、0.8/1.3/1.5 の境界） */}
      <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
        {/* ゾーン背景 */}
        <div className="absolute inset-0 flex">
          <div style={{ width: '40%' }} className="bg-sky-500/30" />
          <div style={{ width: '25%' }} className="bg-emerald-500/40" />
          <div style={{ width: '10%' }} className="bg-amber-500/40" />
          <div style={{ width: '25%' }} className="bg-red-500/40" />
        </div>
        {/* マーカー */}
        {day.established && day.acwr != null && (
          <div
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>0</span>
        <span>0.8</span>
        <span>1.3</span>
        <span>1.5</span>
        <span>2.0+</span>
      </div>

      <p className={`mt-2 text-xs ${meta.color}`}>{meta.hint}</p>
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
  sublabel?: string
}) {
  return (
    <div className="rounded-lg bg-slate-950/60 px-3 py-2.5 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold ${color}`}>{value}</p>
      {sublabel && <p className={`text-[10px] ${color}`}>{sublabel}</p>}
    </div>
  )
}

function Zone({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: hex, opacity: 0.5 }} />
      <span className="text-slate-400">{label}</span>
    </div>
  )
}

function formatDateLabel(dateStr: string, totalDays: number): string {
  const [, m, d] = dateStr.split('-')
  if (totalDays >= 90) return `${Number(m)}月`
  return `${Number(m)}/${Number(d)}`
}
