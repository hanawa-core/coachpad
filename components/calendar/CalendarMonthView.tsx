'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  getWorkoutsByMonth,
  getStrengthAssignmentsByMonth,
  duplicateWorkoutToDate,
  duplicateStrengthAssignmentToDate,
  moveWorkoutToDate,
  moveStrengthAssignmentToDate,
} from '@/lib/firebase/firestore'
import { calculateAchievement } from '@/lib/achievement'
import { getPhaseForDate } from '@/lib/race-phase'
import { useAuth } from '@/components/providers/AuthProvider'
import { getUserProfile } from '@/lib/firebase/firestore'
import type { Workout, StrengthAssignment, TargetRace, UserProfile } from '@/types'
import { Trophy } from 'lucide-react'
import { clsx } from 'clsx'

type DragData =
  | { type: 'workout'; id: string; date: string }
  | { type: 'strength'; id: string; date: string }

interface Props {
  athleteId: string
  isCoachView?: boolean
  refreshKey?: number
}

export function CalendarMonthView({ athleteId, isCoachView = false, refreshKey = 0 }: Props) {
  const { user } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-12
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [strength, setStrength] = useState<StrengthAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [dropping, setDropping] = useState(false)
  const [internalRefresh, setInternalRefresh] = useState(0)
  const [races, setRaces] = useState<TargetRace[]>([])

  // 選手プロフィールから target races を取得
  useEffect(() => {
    getUserProfile(athleteId).then((p: UserProfile | null) => {
      setRaces(p?.targetRaces ?? [])
    })
  }, [athleteId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const coachId = isCoachView ? user?.uid : undefined
      const [w, s] = await Promise.all([
        getWorkoutsByMonth(athleteId, year, month, coachId),
        getStrengthAssignmentsByMonth(athleteId, year, month, coachId),
      ])
      if (!cancelled) {
        setWorkouts(w)
        setStrength(s)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [athleteId, year, month, refreshKey, internalRefresh, isCoachView, user?.uid])

  /**
   * ドロップ処理
   * - Shift キー押下: 移動（元を削除）
   * - 通常: コピー（元を残す）
   */
  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault()
    setDragOverDate(null)
    if (!isCoachView) return // コーチのみD&D可

    const dataStr = e.dataTransfer.getData('application/json')
    if (!dataStr) return

    try {
      const data: DragData = JSON.parse(dataStr)
      if (data.date === targetDate) return // 同じ日にドロップしても何もしない

      const isMove = e.shiftKey
      setDropping(true)

      if (data.type === 'workout') {
        if (isMove) {
          await moveWorkoutToDate(data.id, targetDate)
        } else {
          await duplicateWorkoutToDate(data.id, targetDate)
        }
      } else {
        if (isMove) {
          await moveStrengthAssignmentToDate(data.id, targetDate)
        } else {
          await duplicateStrengthAssignmentToDate(data.id, targetDate)
        }
      }
      setInternalRefresh((k) => k + 1)
    } finally {
      setDropping(false)
    }
  }

  const handleDragOver = (e: React.DragEvent, date: string) => {
    if (!isCoachView) return
    e.preventDefault()
    e.dataTransfer.dropEffect = e.shiftKey ? 'move' : 'copy'
    if (date !== dragOverDate) setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDragStart = (e: React.DragEvent, data: DragData) => {
    if (!isCoachView) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copyMove'
  }

  // 月のグリッド生成
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, Workout[]>()
    workouts.forEach((w) => {
      const list = map.get(w.date) ?? []
      list.push(w)
      map.set(w.date, list)
    })
    return map
  }, [workouts])

  const strengthByDate = useMemo(() => {
    const map = new Map<string, StrengthAssignment[]>()
    strength.forEach((s) => {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    })
    return map
  }, [strength])

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else setMonth(month + 1)
  }
  const todayStr = formatDate(today)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-semibold text-white">
          {year}年 {month}月
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 現在のフェーズ表示 */}
      {races.length > 0 && (() => {
        const todayPhase = getPhaseForDate(todayStr, races)
        return (
          <div className={clsx(
            'flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs',
            todayPhase.bgColor
          )}>
            <div className="flex items-center gap-2">
              <span className={clsx('font-bold', todayPhase.color)}>
                現在: {todayPhase.label}
              </span>
              {todayPhase.daysToRace !== null && todayPhase.raceName && (
                <span className="text-slate-300">
                  {todayPhase.daysToRace > 0
                    ? `${todayPhase.raceName} まで ${todayPhase.daysToRace}日`
                    : todayPhase.daysToRace === 0
                      ? `${todayPhase.raceName} 当日`
                      : `${todayPhase.raceName} 後 ${Math.abs(todayPhase.daysToRace)}日`}
                </span>
              )}
            </div>
            <span className="text-slate-400">{todayPhase.description}</span>
          </div>
        )
      })()}

      {/* ドラッグヒント（コーチのみ） */}
      {isCoachView && (
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-4 py-1.5 text-[10px] text-slate-500">
          <span>💡 メニューをドラッグ&ドロップで別日に <span className="text-purple-400 font-medium">コピー</span> / Shift+ドロップで <span className="text-blue-400 font-medium">移動</span></span>
          {dropping && <span className="text-emerald-400 animate-pulse">処理中...</span>}
        </div>
      )}

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div
            key={d}
            className={clsx(
              'px-2 py-2 text-center text-xs font-medium',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          const dateStr = cell.date
          const ws = dateStr ? workoutsByDate.get(dateStr) ?? [] : []
          const ss = dateStr ? strengthByDate.get(dateStr) ?? [] : []
          const isToday = dateStr === todayStr
          const isCurrentMonth = cell.inMonth

          const isDropTarget = dateStr === dragOverDate
          const phase = dateStr ? getPhaseForDate(dateStr, races) : null
          const isRaceDay = phase?.daysToRace === 0
          return (
            <div
              key={idx}
              onDragOver={dateStr ? (e) => handleDragOver(e, dateStr) : undefined}
              onDragLeave={handleDragLeave}
              onDrop={dateStr ? (e) => handleDrop(e, dateStr) : undefined}
              className={clsx(
                'min-h-[80px] border-b border-r border-slate-800 p-1.5 transition-colors relative',
                !isCurrentMonth && 'bg-slate-950/50',
                isCurrentMonth && phase && phase.bgColor,
                isToday && 'ring-1 ring-emerald-500/50',
                isDropTarget && 'bg-purple-950/40 ring-2 ring-purple-500 ring-inset'
              )}
            >
              {isRaceDay && phase && (
                <div className="absolute right-1 top-1 z-10" title={phase.raceName ?? 'レース日'}>
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                </div>
              )}
              {dateStr && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={clsx(
                        'text-xs font-medium',
                        !isCurrentMonth ? 'text-slate-600' : 'text-slate-300',
                        isToday && 'text-emerald-400 font-bold'
                      )}
                    >
                      {cell.day}
                    </span>
                    {isCoachView && isCurrentMonth && (
                      <Link
                        href={`/calendar/${athleteId}?date=${dateStr}&action=plan`}
                        className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div className="space-y-1">
                    {ws.map((w) => {
                      const achievement = calculateAchievement(w)
                      const wType = w.planned?.workoutType ?? w.completed?.workoutType
                      const isRest = wType === 'rest'
                      return (
                        <Link
                          key={w.id}
                          href={`/workouts/${w.id}`}
                          draggable={isCoachView && !!w.planned}
                          onDragStart={(e) =>
                            handleDragStart(e, {
                              type: 'workout',
                              id: w.id,
                              date: w.date,
                            })
                          }
                          className={clsx(
                            'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                            w.completed
                              ? 'bg-emerald-600/30 text-emerald-300'
                              : isRest
                                ? 'bg-blue-600/30 text-blue-300'
                                : 'bg-yellow-600/30 text-yellow-300',
                            isCoachView && w.planned && 'cursor-grab active:cursor-grabbing'
                          )}
                        >
                          {achievement && (
                            <span className="inline-block mr-1 font-bold">
                              {achievement.percent}%
                            </span>
                          )}
                          {isRest ? '😴' : '🏃'} {w.planned?.title ?? w.completed?.title ?? 'ラン'}
                        </Link>
                      )
                    })}
                    {ss.map((s) => (
                      <Link
                        key={s.id}
                        href={`/strength/${s.id}`}
                        draggable={isCoachView}
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'strength',
                            id: s.id,
                            date: s.date,
                          })
                        }
                        className={clsx(
                          'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                          s.status === 'completed'
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-green-600/30 text-green-300',
                          isCoachView && 'cursor-grab active:cursor-grabbing'
                        )}
                      >
                        💪 {s.templateSnapshot.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
          読み込み中...
        </div>
      )}
    </div>
  )
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface GridCell {
  day: number
  date: string | null
  inMonth: boolean
}

function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = new Date(year, month - 1, 1)
  const startDay = first.getDay() // 0=日
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: GridCell[] = []

  // 前月の埋め
  const prevMonthDays = new Date(year, month - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    cells.push({
      day: d,
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      inMonth: false,
    })
  }

  // 今月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      inMonth: true,
    })
  }

  // 翌月の埋め (合計42=6行になるよう)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    cells.push({
      day: d,
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      inMonth: false,
    })
  }

  return cells
}
