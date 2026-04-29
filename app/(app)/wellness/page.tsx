'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { WellnessForm } from '@/components/wellness/WellnessForm'
import { WellnessChart } from '@/components/wellness/WellnessChart'
import { getRecentWellnessEntries } from '@/lib/firebase/firestore'
import type { WellnessEntry } from '@/types'
import { Heart, Calendar } from 'lucide-react'

const PRESETS = [
  { days: 7, label: '7日' },
  { days: 14, label: '14日' },
  { days: 30, label: '30日' },
  { days: 90, label: '90日' },
]

export default function WellnessPage() {
  const { user, profile } = useAuth()
  const [days, setDays] = useState(7)
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    getRecentWellnessEntries(user.uid, days).then(setEntries)
  }, [user, days, refreshKey])

  if (profile?.role !== 'athlete') {
    return (
      <>
        <TopBar title="Wellness" />
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-400">この機能は選手のみ利用できます</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Wellness" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        {/* 本日の入力 */}
        {user && (
          <WellnessForm athleteId={user.uid} onSaved={() => setRefreshKey((k) => k + 1)} />
        )}

        {/* 期間選択 + 推移チャート */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Heart className="h-5 w-5 text-pink-400" />
              体調の推移
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
          {user && <WellnessChart athleteId={user.uid} days={days} />}
        </div>

        {/* 履歴一覧 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            記録履歴 ({entries.length}件)
          </h2>
          {entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">記録がありません</p>
          ) : (
            <ul className="space-y-2">
              {[...entries].reverse().map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{e.date}</span>
                    <div className="flex gap-2 text-xs">
                      {e.sleepHours != null && (
                        <span className="text-blue-400">😴 {e.sleepHours}h</span>
                      )}
                      {e.restingHr != null && (
                        <span className="text-red-400">❤ {e.restingHr}</span>
                      )}
                      {e.weight != null && (
                        <span className="text-slate-400">⚖ {e.weight}kg</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 grid grid-cols-5 gap-1 text-[10px]">
                    <ScoreBadge label="睡眠" value={e.sleepQuality} good />
                    <ScoreBadge label="疲労" value={e.fatigue} good={false} />
                    <ScoreBadge label="筋肉痛" value={e.soreness} good={false} />
                    <ScoreBadge label="気分" value={e.mood} good />
                    <ScoreBadge label="ストレス" value={e.stress} good={false} />
                  </div>
                  {e.notes && (
                    <p className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">{e.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function ScoreBadge({
  label,
  value,
  good,
}: {
  label: string
  value: number | null
  good: boolean // true なら高い値が良い
}) {
  if (value == null)
    return (
      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-center text-slate-600">
        {label}: -
      </span>
    )
  const intensity = good ? value : 6 - value
  const color =
    intensity >= 4
      ? 'bg-emerald-600/30 text-emerald-300'
      : intensity === 3
        ? 'bg-yellow-600/30 text-yellow-300'
        : 'bg-red-600/30 text-red-300'
  return (
    <span className={`rounded px-1.5 py-0.5 text-center ${color}`}>
      {label}:{value}
    </span>
  )
}
