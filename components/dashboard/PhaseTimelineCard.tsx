'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Plus } from 'lucide-react'
import { getUserProfile } from '@/lib/firebase/firestore'
import { getPhaseForDate } from '@/lib/race-phase'
import type { TargetRace } from '@/types'
import { clsx } from 'clsx'

interface Props {
  athleteId: string
}

const STAGES = [
  { id: 'volume', label: 'ボリューム', daysFromRace: 999 },
  { id: 'build', label: 'ビルド', daysFromRace: 42 },
  { id: 'peak', label: 'ピーク', daysFromRace: 14 },
  { id: 'taper', label: 'テーパー', daysFromRace: 7 },
  { id: 'race_week', label: 'レース', daysFromRace: 0 },
] as const

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  volume: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-500' },
  build: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', dot: 'bg-cyan-500' },
  peak: { bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-500' },
  taper: { bg: 'bg-orange-500/15', text: 'text-orange-300', dot: 'bg-orange-500' },
  race_week: { bg: 'bg-red-500/15', text: 'text-red-300', dot: 'bg-red-500' },
  recovery: { bg: 'bg-blue-500/15', text: 'text-blue-300', dot: 'bg-blue-500' },
}

export function PhaseTimelineCard({ athleteId }: Props) {
  const [races, setRaces] = useState<TargetRace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserProfile(athleteId).then((p) => {
      setRaces(p?.targetRaces ?? [])
      setLoading(false)
    })
  }, [athleteId])

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const phase = getPhaseForDate(todayStr, races)

  // 直近のレース（未来日）を取得
  const futureRaces = races
    .map((r) => ({
      ...r,
      dateObj: (r.raceDate as any).toDate
        ? (r.raceDate as any).toDate()
        : new Date(r.raceDate as any),
    }))
    .filter((r) => r.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

  const nextRace = futureRaces[0] ?? null
  const daysToRace = nextRace
    ? Math.ceil((nextRace.dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const currentColors = STAGE_COLORS[phase.phase] ?? STAGE_COLORS.volume

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">期分け（ピリオダイゼーション）</h2>
        <Link
          href="/settings/races"
          className="text-xs text-slate-400 hover:text-white"
        >
          レース管理
        </Link>
      </div>

      {/* 現在のフェーズ */}
      <div className={clsx('rounded-lg px-4 py-3 mb-4', currentColors.bg)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">現在</p>
            <p className={clsx('text-xl sm:text-2xl font-bold', currentColors.text)}>
              {phase.label}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">{phase.description}</p>
          </div>
          {nextRace && daysToRace !== null && (
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">次のレース</p>
              <p className="text-sm font-semibold text-white truncate max-w-[180px]">
                {nextRace.raceName}
              </p>
              <p className="text-xs text-slate-400">
                {nextRace.dateObj.getFullYear()}/{nextRace.dateObj.getMonth() + 1}/{nextRace.dateObj.getDate()}
              </p>
              <p className="mt-1 text-base font-bold text-white">残り {daysToRace}日</p>
            </div>
          )}
        </div>
      </div>

      {nextRace && daysToRace !== null ? (
        <>
          {/* ステージタイムライン */}
          <div className="relative">
            {/* バー */}
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-950">
              {STAGES.slice(0, 4).map((stage, i) => {
                const next = STAGES[i + 1]
                const widthPct = ((stage.daysFromRace - (next?.daysFromRace ?? 0)) / Math.max(STAGES[0].daysFromRace, daysToRace)) * 100
                const isCurrent = phase.phase === stage.id
                const cls = STAGE_COLORS[stage.id]
                return (
                  <div
                    key={stage.id}
                    className={clsx(cls.dot, isCurrent ? 'opacity-100' : 'opacity-40')}
                    style={{ width: `${Math.min(widthPct, 100)}%` }}
                  />
                )
              })}
              <div className="bg-red-500" style={{ width: '4px' }} title="レース当日" />
            </div>

            {/* 今日のマーカー */}
            {(() => {
              const totalDays = Math.max(STAGES[0].daysFromRace, daysToRace)
              const todayLeftPct = (1 - daysToRace / totalDays) * 100
              return (
                <div
                  className="absolute -top-1 h-4 w-0.5 bg-white shadow-lg"
                  style={{ left: `${Math.max(0, Math.min(100, todayLeftPct))}%` }}
                  title="今日"
                />
              )
            })()}
          </div>

          {/* ステージラベル */}
          <div className="mt-3 grid grid-cols-5 gap-1 text-center">
            {STAGES.map((stage) => {
              const cls = STAGE_COLORS[stage.id]
              const isCurrent = phase.phase === stage.id
              return (
                <div key={stage.id} className="flex flex-col items-center gap-1">
                  <span className={clsx('inline-block h-2 w-2 rounded-full', cls.dot, isCurrent ? 'ring-2 ring-white' : 'opacity-50')} />
                  <span className={clsx('text-[10px] font-medium', isCurrent ? cls.text : 'text-slate-500')}>
                    {stage.label}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
            ※ レース前 42日以降: ビルド / 14日以降: ピーク / 7日以内: テーパー / レース当日: レース週
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 px-4 py-6 text-center">
          <Trophy className="mx-auto h-6 w-6 text-slate-600 mb-2" />
          <p className="text-sm text-slate-400 mb-3">目標レースが未登録です</p>
          <Link
            href="/settings/races"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" />
            レースを登録
          </Link>
        </div>
      )}
    </div>
  )
}
