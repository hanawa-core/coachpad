'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Workout, UserProfile } from '@/types'

interface Props {
  workout: Workout
  profile?: UserProfile | null
}

interface ZoneDef {
  id: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
  label: string
  description: string
  minPct: number
  maxPct: number
  color: string
  bgClass: string
  textClass: string
}

const ZONES: ZoneDef[] = [
  {
    id: 'Z1',
    label: 'Z1 リカバリー',
    description: '会話できる強度。有酸素能力の土台',
    minPct: 0,
    maxPct: 85,
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-300',
  },
  {
    id: 'Z2',
    label: 'Z2 有酸素',
    description: '脂肪燃焼、ベース構築',
    minPct: 85,
    maxPct: 90,
    color: '#10b981',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-300',
  },
  {
    id: 'Z3',
    label: 'Z3 テンポ',
    description: 'マラソンペース付近、持久力向上',
    minPct: 90,
    maxPct: 95,
    color: '#eab308',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-300',
  },
  {
    id: 'Z4',
    label: 'Z4 閾値',
    description: '約1時間維持できる強度、LT向上',
    minPct: 95,
    maxPct: 100,
    color: '#f97316',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-300',
  },
  {
    id: 'Z5',
    label: 'Z5 VO2max',
    description: '短時間高強度、最大酸素摂取量向上',
    minPct: 100,
    maxPct: Infinity,
    color: '#ef4444',
    bgClass: 'bg-red-500',
    textClass: 'text-red-300',
  },
]

/**
 * 心拍値から所属ゾーンを判定
 */
function zoneOfHr(hr: number, lthr: number): ZoneDef {
  const pct = (hr / lthr) * 100
  return ZONES.find((z) => pct >= z.minPct && pct < z.maxPct) ?? ZONES[ZONES.length - 1]
}

/**
 * 時系列心拍データから各ゾーンの滞在時間を計算
 *
 * Strava streams は通常 1Hz サンプリング（time 配列がインデックス毎の秒数）。
 * 隣接サンプル間の時間差を該当ゾーンに加算する。
 */
function computeZoneDistribution(
  heartrate: number[],
  time: number[],
  lthr: number
): { zone: ZoneDef; seconds: number }[] {
  const buckets = new Map<string, number>()
  for (let i = 1; i < heartrate.length; i++) {
    const dt = (time[i] ?? i) - (time[i - 1] ?? i - 1)
    if (dt <= 0) continue
    const hr = heartrate[i]
    if (!hr) continue
    const z = zoneOfHr(hr, lthr)
    buckets.set(z.id, (buckets.get(z.id) ?? 0) + dt)
  }
  return ZONES.map((z) => ({ zone: z, seconds: buckets.get(z.id) ?? 0 }))
}

function formatDuration(sec: number): string {
  const totalMin = Math.floor(sec / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`
  return `${s}秒`
}

export function ZoneAnalysis({ workout, profile }: Props) {
  const { user } = useAuth()
  const [heartrate, setHeartrate] = useState<number[] | null>(null)
  const [time, setTime] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const avgHr = workout.completed?.avgHeartRate
  const lthr = profile?.thresholdHr
  const stravaLinked = !!(workout as any).stravaActivityId

  // Strava 連携があれば自動でストリームを取得
  useEffect(() => {
    if (!user || !stravaLinked) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const idToken = await user.getIdToken()
        const res = await fetch(`/api/strava/streams?workoutId=${workout.id}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (cancelled) return
        setHeartrate(data.streams?.heartrate?.data ?? null)
        setTime(data.streams?.time?.data ?? null)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, workout.id, stravaLinked])

  if (!avgHr) return null

  if (!lthr) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400">
        ゾーン分析にはプロフィールで「閾値心拍 (LTHR)」を設定してください
      </div>
    )
  }

  // 時系列データがあれば各ゾーン分布を計算、なければ平均HRから主要ゾーンのみ
  const distribution = heartrate && time && heartrate.length > 0
    ? computeZoneDistribution(heartrate, time, lthr)
    : null
  const totalSec = distribution
    ? distribution.reduce((sum, d) => sum + d.seconds, 0)
    : 0
  const avgZone = zoneOfHr(avgHr, lthr)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-emerald-400" />
          ゾーン分析
        </h3>
        <p className="text-[10px] text-slate-500">
          LTHR {lthr} bpm 基準
        </p>
      </div>

      {loading && (
        <p className="text-xs text-slate-500 py-2">ゾーン分布データ取得中...</p>
      )}
      {error && (
        <p className="text-xs text-red-400 py-2">エラー: {error}</p>
      )}

      {distribution && totalSec > 0 ? (
        <>
          {/* 積み上げバー */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-950 mb-3">
            {distribution.map(({ zone, seconds }) => {
              const pct = (seconds / totalSec) * 100
              if (pct === 0) return null
              return (
                <div
                  key={zone.id}
                  className={zone.bgClass}
                  style={{ width: `${pct}%` }}
                  title={`${zone.label}: ${formatDuration(seconds)}`}
                />
              )
            })}
          </div>

          {/* 各ゾーンの内訳 */}
          <div className="space-y-1.5">
            {distribution.map(({ zone, seconds }) => {
              const pct = (seconds / totalSec) * 100
              return (
                <div key={zone.id} className="flex items-center gap-2 text-xs">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${zone.bgClass} shrink-0`} />
                  <span className={`font-semibold ${zone.textClass} w-24 shrink-0`}>
                    {zone.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className={`h-full ${zone.bgClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-300 font-mono tabular-nums w-16 text-right shrink-0">
                    {formatDuration(seconds)}
                  </span>
                  <span className="text-slate-500 font-mono tabular-nums w-12 text-right shrink-0">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            合計 {formatDuration(totalSec)} · 時系列心拍データから算出
          </p>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-sm ${avgZone.bgClass}`} />
            <p className="text-sm text-white">
              主要ゾーン: <span className="font-bold">{avgZone.label}</span>
            </p>
          </div>
          <p className="text-xs text-slate-400">{avgZone.description}</p>
          <p className="text-[10px] text-slate-500">
            平均HR {avgHr} bpm = LTHR の {Math.round((avgHr / lthr) * 100)}%
          </p>
          {!stravaLinked && (
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
              Strava連携すると各ゾーンの滞在時間も表示されます
            </p>
          )}
        </div>
      )}
    </div>
  )
}
