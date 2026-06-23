'use client'

/**
 * コーチ向け負荷アラート一覧。
 * - srpe 選手: ACWR > 1.5（高リスク）または < 0.8（低負荷）
 * - strava_ctl 選手: TSB が極端（オーバートレーニング / 休みすぎ）
 *
 * 既存の CoachWellnessAlert と同じく、選手ごとに必要データを取得して判定する。
 * Strava/CTL 側のしきい値判定は latestMetrics（既存キャッシュ）をそのまま読むだけ。
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Activity, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { subscribeAthletes, getRecentWellnessEntries } from '@/lib/firebase/firestore'
import { resolveLoadModel } from '@/lib/presets'
import {
  dailyLoadFor,
  computeSrpeSeries,
  ACWR_ZONE_META,
} from '@/lib/load/srpe'
import type { AthleteCache, Workout } from '@/types'

interface LoadAlertItem {
  athleteId: string
  displayName: string
  reason: string
  color: string
}

// strava_ctl の極端 TSB しきい値（FitnessChart のゾーン定義に準拠）
const TSB_OVERTRAINED = -30
const TSB_TOO_FRESH = 25

export function CoachLoadAlert() {
  const { user } = useAuth()
  const [items, setItems] = useState<LoadAlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAthletes(user.uid, async (athletes) => {
      const results = await Promise.all(athletes.map((a) => evaluateAthlete(a)))
      setItems(results.filter((r): r is LoadAlertItem => r !== null))
      setLoading(false)
    })
    return unsub
  }, [user])

  if (loading || items.length === 0) return null

  return (
    <div className="rounded-xl border border-red-800/50 bg-red-950/10 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-red-300">
        <AlertTriangle className="h-5 w-5" />
        負荷アラート ({items.length})
      </h2>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.athleteId}>
            <Link
              href={`/athletes/${it.athleteId}`}
              className="flex items-center justify-between rounded-lg border border-red-900/50 bg-slate-950 px-3 py-2 hover:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-white">{it.displayName}</span>
              </div>
              <span className={`text-xs ${it.color}`}>{it.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function evaluateAthlete(a: AthleteCache): Promise<LoadAlertItem | null> {
  const loadModel = resolveLoadModel(a.activityPreset, a.loadModelOverride)

  if (loadModel === 'strava_ctl') {
    const tsb = a.latestMetrics?.tsb
    if (tsb == null) return null
    if (tsb < TSB_OVERTRAINED) {
      return {
        athleteId: a.userId,
        displayName: a.displayName,
        reason: `TSB ${tsb.toFixed(0)}（オーバートレーニング）`,
        color: 'text-red-400',
      }
    }
    if (tsb > TSB_TOO_FRESH) {
      return {
        athleteId: a.userId,
        displayName: a.displayName,
        reason: `TSB +${tsb.toFixed(0)}（休みすぎ）`,
        color: 'text-amber-400',
      }
    }
    return null
  }

  // srpe: 毎日のウェルネス入力（優先）+ ワークアウト記録から最新 ACWR を算出
  const [snap, wellness] = await Promise.all([
    getDocs(query(collection(db, 'workouts'), where('athleteId', '==', a.userId))),
    getRecentWellnessEntries(a.userId, 60).catch(() => []),
  ])
  const workouts = snap.docs.map((d) => ({ ...(d.data() as Workout), id: d.id }))
  const series = computeSrpeSeries(dailyLoadFor(workouts, wellness), { lookbackDays: 7 })
  const latest = series[series.length - 1]
  if (!latest || !latest.established || latest.acwr == null) return null

  if (latest.zone === 'risk' || latest.zone === 'low') {
    const meta = ACWR_ZONE_META[latest.zone]
    return {
      athleteId: a.userId,
      displayName: a.displayName,
      reason: `ACWR ${latest.acwr.toFixed(2)}（${meta.label}）`,
      color: meta.color,
    }
  }
  return null
}
