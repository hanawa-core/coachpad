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
import { calculateAchievement, calculateDayAchievement } from '@/lib/achievement'
import { getPhaseForDate } from '@/lib/race-phase'
import { useAuth } from '@/components/providers/AuthProvider'
import { getUserProfile } from '@/lib/firebase/firestore'
import type { Workout, StrengthAssignment, TargetRace, UserProfile } from '@/types'
import { Trophy } from 'lucide-react'
import { clsx } from 'clsx'

type DragData =
  | { type: 'workout'; id: string; date: string }
  | { type: 'strength'; id: string; date: string }

type ViewMode = 'day' | 'week' | 'month'

interface Props {
  athleteId: string
  isCoachView?: boolean
  refreshKey?: number
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
]

export function CalendarMonthView({ athleteId, isCoachView = false, refreshKey = 0 }: Props) {
  const { user } = useAuth()
  const today = new Date()
  const [view, setView] = useState<ViewMode>('month')
  const [focalDate, setFocalDate] = useState<Date>(today) // 表示中の基準日
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

  // 表示範囲を計算（view と focalDate から）
  const { rangeStart, rangeEnd, monthsToFetch } = useMemo(() => {
    return computeRange(view, focalDate)
  }, [view, focalDate])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const coachId = isCoachView ? user?.uid : undefined
      // 表示範囲がまたぐ月を全部取得（重複は集約）
      const results = await Promise.all(
        monthsToFetch.map(async ({ year, month }) => {
          const [w, s] = await Promise.all([
            getWorkoutsByMonth(athleteId, year, month, coachId),
            getStrengthAssignmentsByMonth(athleteId, year, month, coachId),
          ])
          return { w, s }
        })
      )
      if (cancelled) return
      const wMap = new Map<string, Workout>()
      const sMap = new Map<string, StrengthAssignment>()
      results.forEach(({ w, s }) => {
        w.forEach((it) => wMap.set(it.id, it))
        s.forEach((it) => sMap.set(it.id, it))
      })
      setWorkouts(Array.from(wMap.values()))
      setStrength(Array.from(sMap.values()))
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [athleteId, monthsToFetch, refreshKey, internalRefresh, isCoachView, user?.uid])

  /**
   * ドロップ処理
   */
  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault()
    setDragOverDate(null)
    if (!isCoachView) return

    const dataStr = e.dataTransfer.getData('application/json')
    if (!dataStr) return

    try {
      const data: DragData = JSON.parse(dataStr)
      if (data.date === targetDate) return
      const isMove = e.shiftKey
      setDropping(true)
      if (data.type === 'workout') {
        if (isMove) await moveWorkoutToDate(data.id, targetDate)
        else await duplicateWorkoutToDate(data.id, targetDate)
      } else {
        if (isMove) await moveStrengthAssignmentToDate(data.id, targetDate)
        else await duplicateStrengthAssignmentToDate(data.id, targetDate)
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

  const handleDragLeave = () => setDragOverDate(null)

  const handleDragStart = (e: React.DragEvent, data: DragData) => {
    if (!isCoachView) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copyMove'
  }

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

  const todayStr = formatDate(today)

  // ヘッダーの表示テキストと、前後ナビゲーション
  const headerTitle = useMemo(() => formatHeader(view, focalDate), [view, focalDate])
  const goPrev = () => setFocalDate(shiftFocalDate(view, focalDate, -1))
  const goNext = () => setFocalDate(shiftFocalDate(view, focalDate, 1))

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 sm:px-4 sm:py-3 gap-2">
        <button
          onClick={goPrev}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0"
          aria-label="前へ"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm sm:text-base font-semibold text-white text-center truncate flex-1 min-w-0">
          {headerTitle}
        </h2>
        <button
          onClick={goNext}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0"
          aria-label="次へ"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 表示モード切替 */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2 gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={clsx(
                'rounded px-3 py-1 text-xs font-medium transition-colors',
                view === opt.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFocalDate(new Date())}
          className="rounded px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
        >
          今日
        </button>
      </div>

      {/* 現在のフェーズ表示 */}
      {races.length > 0 && (() => {
        const todayPhase = getPhaseForDate(todayStr, races)
        return (
          <div className={clsx(
            'flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2 text-xs',
            todayPhase.bgColor
          )}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={clsx('font-bold', todayPhase.color)}>
                現在: {todayPhase.label}
              </span>
              {todayPhase.daysToRace !== null && todayPhase.raceName && (
                <span className="text-slate-300 truncate">
                  {todayPhase.daysToRace > 0
                    ? `${todayPhase.raceName} まで ${todayPhase.daysToRace}日`
                    : todayPhase.daysToRace === 0
                      ? `${todayPhase.raceName} 当日`
                      : `${todayPhase.raceName} 後 ${Math.abs(todayPhase.daysToRace)}日`}
                </span>
              )}
            </div>
            <span className="text-slate-400 hidden sm:inline">{todayPhase.description}</span>
          </div>
        )
      })()}

      {/* ドラッグヒント（コーチのみ・月表示のみ） */}
      {isCoachView && view === 'month' && (
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-4 py-1.5 text-[10px] text-slate-500">
          <span>ドラッグ&ドロップで別日に <span className="text-purple-400 font-medium">コピー</span> / Shift+ドロップで <span className="text-blue-400 font-medium">移動</span></span>
          {dropping && <span className="text-emerald-400 animate-pulse">処理中...</span>}
        </div>
      )}

      {/* メインビュー */}
      {view === 'month' && (
        <MonthView
          focalDate={focalDate}
          races={races}
          todayStr={todayStr}
          workoutsByDate={workoutsByDate}
          strengthByDate={strengthByDate}
          dragOverDate={dragOverDate}
          isCoachView={isCoachView}
          athleteId={athleteId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
        />
      )}
      {view === 'week' && (
        <WeekView
          focalDate={focalDate}
          races={races}
          todayStr={todayStr}
          workoutsByDate={workoutsByDate}
          strengthByDate={strengthByDate}
          dragOverDate={dragOverDate}
          isCoachView={isCoachView}
          athleteId={athleteId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
        />
      )}
      {view === 'day' && (
        <DayView
          focalDate={focalDate}
          races={races}
          todayStr={todayStr}
          workoutsByDate={workoutsByDate}
          strengthByDate={strengthByDate}
          isCoachView={isCoachView}
          athleteId={athleteId}
        />
      )}

      {loading && (
        <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
          読み込み中...
        </div>
      )}
    </div>
  )
}

// ============================================================
// 月ビュー
// ============================================================
interface ViewProps {
  focalDate: Date
  races: TargetRace[]
  todayStr: string
  workoutsByDate: Map<string, Workout[]>
  strengthByDate: Map<string, StrengthAssignment[]>
  dragOverDate: string | null
  isCoachView: boolean
  athleteId: string
  onDragOver: (e: React.DragEvent, date: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, date: string) => void
  onDragStart: (e: React.DragEvent, data: DragData) => void
}

function MonthView(props: ViewProps) {
  const year = props.focalDate.getFullYear()
  const month = props.focalDate.getMonth() + 1
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])
  return (
    <>
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div
            key={d}
            className={clsx(
              'px-1 sm:px-2 py-2 text-center text-[10px] sm:text-xs font-medium',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => (
          <DayCell
            key={idx}
            dateStr={cell.date}
            day={cell.day}
            inMonth={cell.inMonth}
            compact
            {...props}
          />
        ))}
      </div>
    </>
  )
}

// ============================================================
// 週ビュー
// ============================================================
function WeekView(props: ViewProps) {
  const weekDays = useMemo(() => buildWeek(props.focalDate), [props.focalDate])
  return (
    <>
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950">
        {weekDays.map((d, i) => (
          <div
            key={d.date}
            className={clsx(
              'px-1 sm:px-2 py-2 text-center text-[10px] sm:text-xs font-medium',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            <div>{['日', '月', '火', '水', '木', '金', '土'][i]}</div>
            <div className="text-slate-500 mt-0.5">{d.day}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((d) => (
          <DayCell
            key={d.date}
            dateStr={d.date}
            day={d.day}
            inMonth
            showDay={false}
            minHeightClass="min-h-[180px]"
            {...props}
          />
        ))}
      </div>
    </>
  )
}

// ============================================================
// 日ビュー
// ============================================================
function DayView(props: Pick<ViewProps, 'focalDate' | 'races' | 'todayStr' | 'workoutsByDate' | 'strengthByDate' | 'isCoachView' | 'athleteId'>) {
  const dateStr = formatDate(props.focalDate)
  const ws = props.workoutsByDate.get(dateStr) ?? []
  const ss = props.strengthByDate.get(dateStr) ?? []
  const phase = getPhaseForDate(dateStr, props.races)
  const isToday = dateStr === props.todayStr
  const dow = ['日', '月', '火', '水', '木', '金', '土'][props.focalDate.getDay()]

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className={clsx('text-2xl font-bold', isToday ? 'text-emerald-400' : 'text-white')}>
            {props.focalDate.getMonth() + 1}/{props.focalDate.getDate()}
          </span>
          <span className="text-sm text-slate-400">({dow})</span>
          {isToday && <span className="text-xs text-emerald-400 font-medium">今日</span>}
        </div>
        {props.isCoachView && (
          <Link
            href={`/calendar/${props.athleteId}?date=${dateStr}&action=plan`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            追加
          </Link>
        )}
      </div>

      {phase && (
        <div className={clsx('rounded-lg px-3 py-2 text-xs', phase.bgColor)}>
          <span className={clsx('font-bold', phase.color)}>{phase.label}</span>
          <span className="text-slate-300 ml-2">{phase.description}</span>
        </div>
      )}

      {ws.length === 0 && ss.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          この日の予定はありません
        </p>
      ) : (
        <div className="space-y-2">
          {(() => {
            const dayAchievement = calculateDayAchievement(ws)
            const plannedWorkoutId = ws.find((w) => w.planned)?.id
            return ws.map((w) => {
              const wType = w.planned?.workoutType ?? w.completed?.workoutType
              const isRest = wType === 'rest'
              const showAchievement = dayAchievement && w.id === plannedWorkoutId
              return (
                <Link
                  key={w.id}
                  href={`/workouts/${w.id}`}
                  className={clsx(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    w.completed
                      ? 'border-emerald-500/30 bg-emerald-600/10 hover:bg-emerald-600/20'
                      : isRest
                        ? 'border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20'
                        : 'border-yellow-500/30 bg-yellow-600/10 hover:bg-yellow-600/20'
                  )}
                >
                  <div className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold shrink-0',
                    isRest ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                  )}>
                    {isRest ? '休' : 'ラン'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {w.planned?.title ?? w.completed?.title ?? 'ラン'}
                      </h3>
                      {showAchievement && dayAchievement && (
                        <span className={clsx('text-xs font-bold shrink-0', dayAchievement.colorClass.split(' ')[0])}>
                          {dayAchievement.percent}% {dayAchievement.label}
                        </span>
                      )}
                    </div>
                    {w.completed?.distanceKm != null && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {w.completed.distanceKm}km
                        {w.completed.durationMin != null && ` · ${w.completed.durationMin}分`}
                        {w.completed.avgPaceMinPerKm && ` · ${w.completed.avgPaceMinPerKm}/km`}
                      </p>
                    )}
                    {showAchievement && dayAchievement && dayAchievement.actual !== w.completed?.distanceKm && dayAchievement.actual !== w.completed?.durationMin && (
                      <p className="mt-0.5 text-[10px] text-emerald-400">
                        同日合計 {dayAchievement.actual}{dayAchievement.unit} / 計画 {dayAchievement.planned}{dayAchievement.unit}
                      </p>
                    )}
                    {w.planned?.description && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{w.planned.description}</p>
                    )}
                  </div>
                </Link>
              )
            })
          })()}
          {ss.map((s) => (
            <Link
              key={s.id}
              href={`/strength/${s.id}`}
              className={clsx(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                s.status === 'completed'
                  ? 'border-emerald-500/30 bg-emerald-600/10 hover:bg-emerald-600/20'
                  : 'border-green-500/30 bg-green-600/10 hover:bg-green-600/20'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-bold shrink-0">
                筋トレ
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{s.templateSnapshot.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {s.templateSnapshot.exercises.length}種目
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// セル（月・週ビュー共通）
// ============================================================
interface DayCellProps extends ViewProps {
  dateStr: string | null
  day: number
  inMonth: boolean
  compact?: boolean
  showDay?: boolean
  minHeightClass?: string
}

function DayCell({
  dateStr,
  day,
  inMonth,
  compact = false,
  showDay = true,
  minHeightClass,
  races,
  todayStr,
  workoutsByDate,
  strengthByDate,
  dragOverDate,
  isCoachView,
  athleteId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
}: DayCellProps) {
  const ws = dateStr ? workoutsByDate.get(dateStr) ?? [] : []
  const ss = dateStr ? strengthByDate.get(dateStr) ?? [] : []
  const isToday = dateStr === todayStr
  const isDropTarget = dateStr === dragOverDate
  const phase = dateStr ? getPhaseForDate(dateStr, races) : null
  const isRaceDay = phase?.daysToRace === 0
  return (
    <div
      onDragOver={dateStr ? (e) => onDragOver(e, dateStr) : undefined}
      onDragLeave={onDragLeave}
      onDrop={dateStr ? (e) => onDrop(e, dateStr) : undefined}
      className={clsx(
        minHeightClass ?? 'min-h-[80px]',
        'border-b border-r border-slate-800 p-1.5 transition-colors relative',
        !inMonth && 'bg-slate-950/50',
        inMonth && phase && phase.bgColor,
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
          {showDay && (
            <div className="flex items-center justify-between mb-1">
              <span
                className={clsx(
                  'text-[10px] sm:text-xs font-medium',
                  !inMonth ? 'text-slate-600' : 'text-slate-300',
                  isToday && 'text-emerald-400 font-bold'
                )}
              >
                {day}
              </span>
              {isCoachView && inMonth && (
                <Link
                  href={`/calendar/${athleteId}?date=${dateStr}&action=plan`}
                  className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
          <div className="space-y-1">
            {(() => {
              // 同日に planned workout があれば、completed の合計で日次達成率を計算
              // 朝晩2回ラン等を合算して計画と比較
              const dayAchievement = calculateDayAchievement(ws)
              const plannedWorkoutId = ws.find((w) => w.planned)?.id
              return ws.map((w) => {
                const wType = w.planned?.workoutType ?? w.completed?.workoutType
                const isRest = wType === 'rest'
                // 達成率は計画ありの 1 ドキュメントにのみ表示（同日合算）
                const showAchievement = dayAchievement && w.id === plannedWorkoutId
                return (
                  <Link
                    key={w.id}
                    href={`/workouts/${w.id}`}
                    draggable={isCoachView && !!w.planned}
                    onDragStart={(e) =>
                      onDragStart(e, { type: 'workout', id: w.id, date: w.date })
                    }
                    className={clsx(
                      'block truncate rounded px-1.5 py-0.5 font-medium',
                      compact ? 'text-[10px]' : 'text-xs',
                      w.completed
                        ? 'bg-emerald-600/30 text-emerald-300'
                        : isRest
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'bg-yellow-600/30 text-yellow-300',
                      isCoachView && w.planned && 'cursor-grab active:cursor-grabbing'
                    )}
                  >
                    {showAchievement && dayAchievement && (
                      <span className="inline-block mr-1 font-bold">{dayAchievement.percent}%</span>
                    )}
                    <span className="opacity-70">[{isRest ? '休' : 'ラン'}]</span> {w.planned?.title ?? w.completed?.title ?? 'ラン'}
                  </Link>
                )
              })
            })()}
            {ss.map((s) => (
              <Link
                key={s.id}
                href={`/strength/${s.id}`}
                draggable={isCoachView}
                onDragStart={(e) =>
                  onDragStart(e, { type: 'strength', id: s.id, date: s.date })
                }
                className={clsx(
                  'block truncate rounded px-1.5 py-0.5 font-medium',
                  compact ? 'text-[10px]' : 'text-xs',
                  s.status === 'completed'
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'bg-green-600/30 text-green-300',
                  isCoachView && 'cursor-grab active:cursor-grabbing'
                )}
              >
                <span className="opacity-70">[筋]</span> {s.templateSnapshot.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// ユーティリティ
// ============================================================
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatHeader(view: ViewMode, d: Date): string {
  if (view === 'month') return `${d.getFullYear()}年 ${d.getMonth() + 1}月`
  if (view === 'day') {
    const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
    return `${d.getFullYear()}年 ${d.getMonth() + 1}月 ${d.getDate()}日 (${dow})`
  }
  // week
  const week = buildWeek(d)
  const first = week[0]
  const last = week[6]
  if (first.year === last.year && first.month === last.month) {
    return `${first.year}年 ${first.month}月 ${first.day}日 - ${last.day}日`
  }
  return `${first.year}/${first.month}/${first.day} - ${last.year}/${last.month}/${last.day}`
}

function shiftFocalDate(view: ViewMode, d: Date, dir: number): Date {
  const next = new Date(d)
  if (view === 'month') {
    next.setDate(1)
    next.setMonth(next.getMonth() + dir)
  } else if (view === 'week') {
    next.setDate(next.getDate() + 7 * dir)
  } else {
    next.setDate(next.getDate() + dir)
  }
  return next
}

interface DayInfo {
  year: number
  month: number
  day: number
  date: string
}

function buildWeek(d: Date): DayInfo[] {
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay()) // 日曜始まり
  const days: DayInfo[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push({
      year: day.getFullYear(),
      month: day.getMonth() + 1,
      day: day.getDate(),
      date: formatDate(day),
    })
  }
  return days
}

/**
 * 表示範囲を計算 + 取得すべき月リストを返す
 */
function computeRange(view: ViewMode, focalDate: Date): {
  rangeStart: Date
  rangeEnd: Date
  monthsToFetch: { year: number; month: number }[]
} {
  let rangeStart: Date
  let rangeEnd: Date
  if (view === 'month') {
    rangeStart = new Date(focalDate.getFullYear(), focalDate.getMonth(), 1)
    rangeEnd = new Date(focalDate.getFullYear(), focalDate.getMonth() + 1, 0)
  } else if (view === 'week') {
    const week = buildWeek(focalDate)
    const f = week[0]
    const l = week[6]
    rangeStart = new Date(f.year, f.month - 1, f.day)
    rangeEnd = new Date(l.year, l.month - 1, l.day)
  } else {
    rangeStart = new Date(focalDate.getFullYear(), focalDate.getMonth(), focalDate.getDate())
    rangeEnd = rangeStart
  }
  // 月リスト
  const months: { year: number; month: number }[] = []
  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1)
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 })
    cur.setMonth(cur.getMonth() + 1)
  }
  return { rangeStart, rangeEnd, monthsToFetch: months }
}

interface GridCell {
  day: number
  date: string | null
  inMonth: boolean
}

function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = new Date(year, month - 1, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: GridCell[] = []

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

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      inMonth: true,
    })
  }

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
