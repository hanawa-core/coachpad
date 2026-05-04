'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { WellnessForm } from '@/components/wellness/WellnessForm'
import { WellnessChart } from '@/components/wellness/WellnessChart'
import { getRecentWellnessEntries } from '@/lib/firebase/firestore'
import type { WellnessEntry } from '@/types'
import { Heart, Calendar, TrendingUp, PenLine } from 'lucide-react'

const PRESETS = [
  { days: 7, label: '7日' },
  { days: 14, label: '14日' },
  { days: 30, label: '30日' },
  { days: 90, label: '90日' },
]

type Tab = 'record' | 'trend' | 'history'

export default function WellnessPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('record')
  const [days, setDays] = useState(7)
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    getRecentWellnessEntries(user.uid, days).then(setEntries).catch(() => setEntries([]))
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
        {/* タブナビゲーション */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1 gap-1">
          <TabButton
            active={tab === 'record'}
            onClick={() => setTab('record')}
            icon={<PenLine className="h-4 w-4" />}
            label="記録する"
          />
          <TabButton
            active={tab === 'trend'}
            onClick={() => setTab('trend')}
            icon={<TrendingUp className="h-4 w-4" />}
            label="体調推移"
          />
          <TabButton
            active={tab === 'history'}
            onClick={() => setTab('history')}
            icon={<Calendar className="h-4 w-4" />}
            label={`記録履歴 (${entries.length})`}
          />
        </div>

        {/* 記録タブ */}
        {tab === 'record' && user && (
          <WellnessForm
            athleteId={user.uid}
            onSaved={() => {
              setRefreshKey((k) => k + 1)
              setTab('history')
            }}
          />
        )}

        {/* 推移タブ */}
        {tab === 'trend' && (
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
        )}

        {/* 履歴タブ */}
        {tab === 'history' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              記録履歴 ({entries.length}件)
            </h2>
            {entries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 mb-3">記録がありません</p>
                <button
                  onClick={() => setTab('record')}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  <PenLine className="h-4 w-4" />
                  最初の記録をつける
                </button>
              </div>
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
        )}
      </div>
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ScoreBadge({
  label,
  value,
  good,
}: {
  label: string
  value: number | null
  good: boolean
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
